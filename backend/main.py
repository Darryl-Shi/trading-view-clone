from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.websockets import WebSocket
from fastapi.security import OAuth2PasswordBearer
from typing import List, Optional
import yfinance as yf
import pandas as pd
import numpy as np
import talib
import asyncio
import json
from datetime import datetime, timedelta
from pydantic import BaseModel
from databases import Database
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Float, DateTime

# FastAPI app setup
app = FastAPI(title="TradingView Clone API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup (using SQLite for demo, use PostgreSQL in production)
DATABASE_URL = "sqlite:///./tradingview.db"
database = Database(DATABASE_URL)
metadata = MetaData()

# User model
users = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("username", String, unique=True),
    Column("hashed_password", String),
)

# OAuth2 setup
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Pydantic models
class StockData(BaseModel):
    symbol: str
    interval: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class TechnicalIndicator(BaseModel):
    indicator: str
    parameters: dict

# Technical Analysis Functions
class TechnicalAnalysis:
    @staticmethod
    def calculate_indicators(df: pd.DataFrame, indicator: str, params: dict) -> pd.DataFrame:
        if indicator == "SMA":
            period = params.get("period", 20)
            df[f'SMA_{period}'] = talib.SMA(df['Close'], timeperiod=period)
        
        elif indicator == "EMA":
            period = params.get("period", 20)
            df[f'EMA_{period}'] = talib.EMA(df['Close'], timeperiod=period)
        
        elif indicator == "RSI":
            period = params.get("period", 14)
            df['RSI'] = talib.RSI(df['Close'], timeperiod=period)
        
        elif indicator == "MACD":
            fastperiod = params.get("fastperiod", 12)
            slowperiod = params.get("slowperiod", 26)
            signalperiod = params.get("signalperiod", 9)
            df['MACD'], df['MACD_Signal'], df['MACD_Hist'] = talib.MACD(
                df['Close'],
                fastperiod=fastperiod,
                slowperiod=slowperiod,
                signalperiod=signalperiod
            )
        
        elif indicator == "BBANDS":
            period = params.get("period", 20)
            nbdevup = params.get("nbdevup", 2)
            nbdevdn = params.get("nbdevdn", 2)
            df['BB_Upper'], df['BB_Middle'], df['BB_Lower'] = talib.BBANDS(
                df['Close'],
                timeperiod=period,
                nbdevup=nbdevup,
                nbdevdn=nbdevdn
            )
        
        return df

# Market Data Service
class MarketDataService:
    @staticmethod
    async def fetch_stock_data(symbol: str, interval: str, start_date: str = None, end_date: str = None) -> pd.DataFrame:
        try:
            ticker = yf.Ticker(symbol)
            
            # Default to last 6 months if no dates provided
            if not start_date:
                start_date = (datetime.now() - timedelta(days=180)).strftime('%Y-%m-%d')
            if not end_date:
                end_date = datetime.now().strftime('%Y-%m-%d')
            
            df = ticker.history(
                interval=interval,
                start=start_date,
                end=end_date
            )
            
            return df
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching market data: {str(e)}")

# WebSocket manager for real-time updates
class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

websocket_manager = WebSocketManager()

# API Routes
@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

@app.get("/market-data/{symbol}")
async def get_market_data(
    symbol: str,
    interval: str = "1d",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    token: str = Depends(oauth2_scheme)
):
    df = await MarketDataService.fetch_stock_data(symbol, interval, start_date, end_date)
    return df.to_dict(orient='records')

@app.post("/technical-analysis/{symbol}")
async def get_technical_analysis(
    symbol: str,
    indicator: TechnicalIndicator,
    token: str = Depends(oauth2_scheme)
):
    df = await MarketDataService.fetch_stock_data(symbol, "1d")
    df = TechnicalAnalysis.calculate_indicators(df, indicator.indicator, indicator.parameters)
    return df.to_dict(orient='records')

@app.websocket("/ws/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str):
    await websocket_manager.connect(websocket)
    try:
        while True:
            # Simulate real-time updates (replace with actual market data stream)
            df = await MarketDataService.fetch_stock_data(symbol, "1m")
            latest_price = df.iloc[-1].to_dict()
            await websocket.send_json(latest_price)
            await asyncio.sleep(60)  # Update every minute
    except Exception as e:
        websocket_manager.disconnect(websocket)

# Error Handling
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return {"detail": exc.detail}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
