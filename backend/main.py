from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import os
from dotenv import load_dotenv

import database
import models
import schemas
import auth

models.Base.metadata.create_all(bind=database.engine)
load_dotenv()

app = FastAPI(title="CoolCare PWA API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'dist')

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/auth/send-code", response_model=dict)
def send_sms_code(request: schemas.PhoneLoginRequest):
    phone = request.phone.replace(" ", "").replace("-", "")
    db = database.SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.phone == phone).first()
        if not user:
            user = models.User(phone=phone)
            db.add(user)
            db.commit()
            db.refresh(user)
    finally:
        db.close()
    code = auth.create_sms_code(phone)
    return {"message": "SMS code sent", "phone": phone, "debug_code": code}

@app.post("/auth/verify", response_model=schemas.Token)
def verify_sms_code(request: schemas.PhoneVerifyRequest):
    phone = request.phone.replace(" ", "").replace("-", "")
    if not auth.verify_sms_code(phone, request.code):
        raise HTTPException(status_code=400, detail="Invalid or expired code")
    db = database.SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.phone == phone).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.is_verified = True
        db.commit()
        access_token = auth.create_access_token(data={"sub": str(user.id), "phone": user.phone})
        refresh_token = auth.create_refresh_token(data={"sub": str(user.id), "phone": user.phone})
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}
    finally:
        db.close()

@app.post("/auth/refresh", response_model=schemas.Token)
def refresh_token(refresh_token: str):
    payload = auth.decode_token(refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    new_access_token = auth.create_access_token(data={"sub": str(payload.user_id), "phone": payload.phone})
    return {"access_token": new_access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=schemas.UserResponse)
def get_current_user_info(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.put("/auth/me", response_model=schemas.UserResponse)
def update_current_user(update_data: schemas.UserUpdate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user

@app.get("/jobs", response_model=List[schemas.JobResponse])
def get_jobs(status: Optional[str] = None, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    query = db.query(models.Job).filter(models.Job.user_id == current_user.id)
    if status:
        query = query.filter(models.Job.status == status)
    return query.order_by(models.Job.scheduled_at.desc()).all()

@app.get("/jobs/{job_id}", response_model=schemas.JobResponse)
def get_job(job_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id, models.Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@app.post("/jobs", response_model=schemas.JobResponse)
def create_job(job: schemas.JobCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    job_data = job.model_dump(exclude_unset=True)
    # Преобразуем строки даты в datetime объекты
    if 'scheduled_at' in job_data and job_data['scheduled_at']:
        try:
            job_data['scheduled_at'] = datetime.fromisoformat(job_data['scheduled_at'].replace('Z', '+00:00'))
        except:
            job_data['scheduled_at'] = datetime.utcnow()
    db_job = models.Job(**job_data, user_id=current_user.id)
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@app.put("/jobs/{job_id}", response_model=schemas.JobResponse)
def update_job(job_id: int, job_update: schemas.JobUpdate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id, models.Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    update_data = job_update.model_dump(exclude_unset=True)
    # Преобразуем строки даты в datetime объекты
    if 'scheduled_at' in update_data and update_data['scheduled_at']:
        try:
            update_data['scheduled_at'] = datetime.fromisoformat(update_data['scheduled_at'].replace('Z', '+00:00'))
        except:
            update_data['scheduled_at'] = job.scheduled_at
    if 'completed_at' in update_data and update_data['completed_at']:
        try:
            update_data['completed_at'] = datetime.fromisoformat(update_data['completed_at'].replace('Z', '+00:00'))
        except:
            del update_data['completed_at']
    for field, value in update_data.items():
        setattr(job, field, value)
    db.commit()
    db.refresh(job)
    return job

@app.delete("/jobs/{job_id}")
def delete_job(job_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id, models.Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
    return {"message": "Job deleted"}

if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")
    @app.get("/")
    async def serve_index():
        index_path = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path, media_type="text/html")
        return {"error": "Frontend not found"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
