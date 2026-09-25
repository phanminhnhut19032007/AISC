from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings


is_sqlite = "sqlite" in settings.DATABASE_URL
engine_kwargs = {"echo": settings.DEBUG}
if not is_sqlite:
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_size": 10,
        "max_overflow": 20,
    })

engine = create_async_engine(
    settings.DATABASE_URL,
    **engine_kwargs
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    """Dependency: yields an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Create all tables on startup and seed demo data if empty."""
    async with engine.begin() as conn:
        from app.models import base  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)

    # Check and seed demo data if new database
    try:
        from app.models.user import User, UserRole
        from app.core.security import hash_password
        from sqlalchemy import select
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).limit(1))
            if not result.scalar_one_or_none():
                print("[RENTEASY] Empty database detected, auto-seeding demo data...")
                from seed_data import seed
                # Run seed in background safely
                try:
                    await seed()
                except Exception as seed_err:
                    print(f"[RENTEASY] Seed error (ignorable): {seed_err}")
            else:
                # Đảm bảo 2 tài khoản Chu tro & Minh Nhut luôn tồn tại và chính xác
                try:
                    owner_res = await db.execute(select(User).where(User.phone == "0388430402", User.role == UserRole.OWNER))
                    owner = owner_res.scalar_one_or_none()
                    if owner:
                        owner.full_name = "Chu tro"
                        owner.hashed_password = hash_password("MinhNhut1")
                    else:
                        db.add(User(
                            id="6b123c4005724985aa085d7b9abd4f76",
                            email="chutro@smartrent.vn",
                            phone="0388430402",
                            hashed_password=hash_password("MinhNhut1"),
                            full_name="Chu tro",
                            role=UserRole.OWNER,
                            is_active=True,
                        ))

                    tenant_res = await db.execute(select(User).where(User.phone == "0388430402", User.role == UserRole.TENANT))
                    tenant = tenant_res.scalar_one_or_none()
                    if tenant:
                        tenant.full_name = "Minh Nhut"
                        tenant.hashed_password = hash_password("MinhNhut2")
                    else:
                        db.add(User(
                            id="3fba1d98e5ec4a4eb5dc7426586abc75",
                            email="minhnhut@smartrent.vn",
                            phone="0388430402",
                            hashed_password=hash_password("MinhNhut2"),
                            full_name="Minh Nhut",
                            role=UserRole.TENANT,
                            is_active=True,
                        ))
                    await db.commit()
                except Exception as sync_err:
                    print(f"[RENTEASY] Account sync notice: {sync_err}")
    except Exception as e:
        print(f"[RENTEASY] DB check notice: {e}")
