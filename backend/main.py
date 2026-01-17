from fastapi import FastAPI, Request, Response, HTTPException, Depends
from fastapi.responses import JSONResponse
from itsdangerous import URLSafeSerializer
# ... other imports

# Constants
GUEST_MAX = 3
USER_MAX = 15
COOKIE_NAME = "credits_token"
SECRET_KEY = "super-secret-key-change-this"
serializer = URLSafeSerializer(SECRET_KEY)

# Helper: Check if user is signed in (Replace this with your actual auth logic)
def is_signed_in(request: Request):
    # Example: check if an 'auth_token' cookie exists
    return request.cookies.get("auth_token") is not None

@app.get("/me")
def get_me(request: Request):
    token = request.cookies.get(COOKIE_NAME)
    signed_in = is_signed_in(request)
    default_credits = USER_MAX if signed_in else GUEST_MAX

    if not token:
        return {"authenticated": signed_in, "credits_left": default_credits}

    data = read_token(token)
    return {
        "authenticated": signed_in,
        "credits_left": data.get("credits", default_credits) if data else default_credits
    }

@app.post("/analyze")
async def analyze_endpoint(request: Request):
    token = request.cookies.get(COOKIE_NAME)
    signed_in = is_signed_in(request)
    
    # 1. Determine starting credits based on status
    if not token:
        current_credits = USER_MAX if signed_in else GUEST_MAX
    else:
        data = read_token(token)
        if not data:
            current_credits = USER_MAX if signed_in else GUEST_MAX
        else:
            current_credits = data.get("credits", 0)

    # 2. Check if they have enough credits
    if current_credits <= 0:
        raise HTTPException(
            status_code=429, 
            detail="Limit reached. Please sign up for more credits."
        )

    # 3. Deduct credit
    new_credits = current_credits - 1
    
    # 4. Prepare the response
    content = {"result": "analysis done", "credits_left": new_credits}
    response = JSONResponse(content=content)
    
    # 5. Set the updated cookie
    response.set_cookie(
        key=COOKIE_NAME,
        value=create_token(new_credits),
        httponly=True,
        max_age=60 * 60 * 24,
        samesite="lax",
        secure=False, # Set to True in Production with HTTPS
    )
    
    return response