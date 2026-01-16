import torch
import gc
from contextlib import contextmanager
from utils.logger import logger

class MemoryManager:
    """Utility class for managing memory during intensive operations"""
    
    @staticmethod
    def clear_memory():
        """Clear Python garbage collector and PyTorch cache"""
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            torch.cuda.synchronize()
        logger.debug("Memory cleared")
    
    @staticmethod
    def get_memory_info():
        """Get current memory usage information"""
        info = {}
        
        if torch.cuda.is_available():
            info['cuda_allocated'] = torch.cuda.memory_allocated() / 1024**2  # MB
            info['cuda_reserved'] = torch.cuda.memory_reserved() / 1024**2  # MB
            info['cuda_device'] = torch.cuda.get_device_name(0)
        else:
            info['cuda_available'] = False
        
        return info
    
    @staticmethod
    @contextmanager
    def memory_efficient_context():
        """Context manager for memory-intensive operations with automatic cleanup"""
        try:
            MemoryManager.clear_memory()
            yield
        finally:
            MemoryManager.clear_memory()
    
    @staticmethod
    def log_memory_usage(prefix=""):
        """Log current memory usage"""
        info = MemoryManager.get_memory_info()
        if info.get('cuda_available', True):
            logger.info(
                f"{prefix}Memory - CUDA Allocated: {info.get('cuda_allocated', 0):.2f}MB, "
                f"Reserved: {info.get('cuda_reserved', 0):.2f}MB"
            )
        else:
            logger.info(f"{prefix}Using CPU (CUDA not available)")
