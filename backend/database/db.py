from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

DATABASE_URL = "postgresql+asyncpg://postgres:mvYwaBhuSwNvCNPvhyJxABgPoNkkgjzx@postgres.railway.internal:5432/railway"

engine = create_async_engine(
    DATABASE_URL,
    connect_args={"ssl": "require"},
)

new_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncSession:
    async with new_session() as session:
        yield session
