# app_backend/initial_data.py
import asyncio
from app.db.session import SessionLocal
from app.crud import crud_user
from app.schemas.user import UserCreate
from app.models.user import UserRole, ApprovalStatus

async def create_first_superuser():
    print("Attempting to create first superuser...")
    db = SessionLocal()
    try:
        users = crud_user.get_users(db, limit=10)
        superusers = [u for u in users if u.is_superuser or u.role == UserRole.ADMIN]

        if not superusers:
            print("No superuser found, creating one...")
            superuser_email = "admin@example.com"
            superuser_username = "admin"
            superuser_password = "ChangeThisPassword123!"
            
            user_in = UserCreate(
                email=superuser_email,
                username=superuser_username,
                password=superuser_password,
                full_name="Admin User",
                is_active=True,
                is_superuser=True,
                role=UserRole.ADMIN
            )
            created_user = crud_user.create_user(db, user_in=user_in)
            
            if created_user.approval_status == ApprovalStatus.PENDING:
                crud_user.approve_user(db, db_user=created_user)
                print(f"Superuser '{created_user.username}' created and approved.")
            else:
                 print(f"Superuser '{created_user.username}' created (was already {created_user.approval_status.value}).")
        else:
            print(f"Superuser already exists: {superusers[0].username}")
    except Exception as e:
        print(f"Error during superuser creation: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("Creating initial data...")
    asyncio.run(create_first_superuser())
    print("Initial data creation finished.")