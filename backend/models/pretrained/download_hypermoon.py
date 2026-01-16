import os
from transformers import Wav2Vec2ForSequenceClassification, Wav2Vec2FeatureExtractor

def download_and_save():
    save_directory = os.path.dirname(os.path.abspath(__file__))
    
    model_name = "HyperMoon/wav2vec2-base-960h-finetuned-deepfake"

    print(f"📍 Target Folder: {save_directory}")
    print(f"⏳ Connecting to Hugging Face to download '{model_name}'...")
    print("   (This might take 1-2 minutes depending on internet speed)")

    try:
        # 2. Download Model & Extractor (The "Brain")
        model = Wav2Vec2ForSequenceClassification.from_pretrained(model_name)
        extractor = Wav2Vec2FeatureExtractor.from_pretrained(model_name)

        # 3. Save directly to this folder
        print("💾 Saving files to disk...")
        model.save_pretrained(save_directory)
        extractor.save_pretrained(save_directory)

        print("\n" + "="*40)
        print("🎉 SUCCESS! Model is now offline-ready.")
        print(f"📂 You will see 'config.json' and 'pytorch_model.bin' in this folder.")
        print("="*40)

    except Exception as e:
        print(f"\n❌ ERROR: Could not download model.\nReason: {e}")

if __name__ == "__main__":
    download_and_save()