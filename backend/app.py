from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import talib
import numpy as np
import pandas as pd

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

def get_period_for_interval(interval):
    if interval in ['1m', '5m', '15m', '30m']:
        return "1wk"
    elif interval in ['1h', '1d']:
        return "6mo"
    elif interval == '1wk':
        return "2y"
    else:  # '1mo'
        return "max"
    # return "max"

def fetch_stock_data(ticker, interval):
    stock = yf.Ticker(ticker)
    period = get_period_for_interval(interval)
    df = stock.history(interval=interval, period=period)
    return df

def calculate_indicators(df, indicators):
    close = df['Close'].values
    high = df['High'].values
    low = df['Low'].values

    result = {}
    for indicator in indicators:
        if indicator['name'] == 'SMA':
            result['SMA'] = talib.SMA(close, timeperiod=indicator['params']['period'])
        elif indicator['name'] == 'EMA':
            result['EMA'] = talib.EMA(close, timeperiod=indicator['params']['period'])
        elif indicator['name'] == 'RSI':
            result['RSI'] = talib.RSI(close, timeperiod=indicator['params']['period'])
        elif indicator['name'] == 'BB':
            upper, middle, lower = talib.BBANDS(close, timeperiod=indicator['params']['period'], nbdevup=indicator['params']['stdDev'], nbdevdn=indicator['params']['stdDev'], matype=0)
            result['BB'] = {'upper': upper, 'middle': middle, 'lower': lower}

    return result

@app.route('/data/<ticker>')
def get_data(ticker):
    interval = request.args.get('interval', '1d')
    df = fetch_stock_data(ticker, interval)
    indicators = [
        {'name': 'SMA', 'params': {'period': 20}},
        {'name': 'EMA', 'params': {'period': 50}},
        {'name': 'RSI', 'params': {'period': 14}},
        {'name': 'BB', 'params': {'period': 20, 'stdDev': 2}},
    ]
    indicator_values = calculate_indicators(df, indicators)

    data = []
    for index, row in df.iterrows():
        data.append({
            'time': index.timestamp(),
            'open': row['Open'],
            'high': row['High'],
            'low': row['Low'],
            'close': row['Close']
        })

    indicator_data = []
    colors = ['#FF0000', '#00FF00', '#0000FF', '#FFA500', '#800080', '#008080']
    for i, (name, values) in enumerate(indicator_values.items()):
        if name == 'BB':
            indicator_data.append({
                'name': 'BB',
                'color': colors[i % len(colors)],
                'data': {
                    'upper': [{'time': t, 'value': v} for t, v in zip(df.index.astype(int) // 10**9, values['upper']) if not np.isnan(v)],
                    'middle': [{'time': t, 'value': v} for t, v in zip(df.index.astype(int) // 10**9, values['middle']) if not np.isnan(v)],
                    'lower': [{'time': t, 'value': v} for t, v in zip(df.index.astype(int) // 10**9, values['lower']) if not np.isnan(v)]
                }
            })
        else:
            indicator_data.append({
                'name': name,
                'color': colors[i % len(colors)],
                'data': [{'time': t, 'value': v} for t, v in zip(df.index.astype(int) // 10**9, values) if not np.isnan(v)]
            })

    return jsonify({'data': data, 'indicators': indicator_data})

@app.route('/indicator/<ticker>')
def get_indicator(ticker):
    interval = request.args.get('interval', '1d')
    name = request.args.get('name')
    params = {k: int(v) for k, v in request.args.items() if k not in ['interval', 'name']}
    
    df = fetch_stock_data(ticker, interval)
    indicator_values = calculate_indicators(df, [{'name': name, 'params': params}])
    
    if name == 'BB':
        indicator_data = {
            'name': name,
            'data': {
                'upper': [{'time': t, 'value': v} for t, v in zip(df.index.astype(int) // 10**9, indicator_values[name]['upper']) if not np.isnan(v)],
                'middle': [{'time': t, 'value': v} for t, v in zip(df.index.astype(int) // 10**9, indicator_values[name]['middle']) if not np.isnan(v)],
                'lower': [{'time': t, 'value': v} for t, v in zip(df.index.astype(int) // 10**9, indicator_values[name]['lower']) if not np.isnan(v)]
            }
        }
    else:
        indicator_data = {
            'name': name,
            'data': [{'time': t, 'value': v} for t, v in zip(df.index.astype(int) // 10**9, indicator_values[name]) if not np.isnan(v)]
        }
    
    return jsonify(indicator_data)

@app.route('/custom_indicator', methods=['POST', 'OPTIONS'])
def custom_indicator():
    if request.method == 'OPTIONS':
        return '', 204
    
    data = request.json
    ticker = data['ticker']
    code = data['code']
    interval = data.get('interval', '1d')
    name = data.get('name', 'Custom Indicator')

    df = fetch_stock_data(ticker, interval)
    
    try:
        # Create a copy of the locals dictionary
        local_vars = {'df': df}
        
        # Execute the custom indicator code
        exec(code, globals(), local_vars)
        
        # Retrieve the custom_indicator from the local variables
        custom_indicator = local_vars.get('custom_indicator')
        
        if custom_indicator is None:
            return jsonify({'error': 'Custom indicator not found in the executed code'}), 400
        
        # Process the custom indicator based on its type
        if isinstance(custom_indicator, dict):
            # Multiple lines or complex indicator
            indicator_data = {
                'name': name,
                'data': {}
            }
            for key, values in custom_indicator.items():
                indicator_data['data'][key] = [{'time': t, 'value': float(v)} for t, v in zip(df.index.astype(int) // 10**9, values) if not np.isnan(v)]
        elif isinstance(custom_indicator, (list, np.ndarray)):
            # Single line indicator
            indicator_data = {
                'name': name,
                'data': [{'time': t, 'value': float(v)} for t, v in zip(df.index.astype(int) // 10**9, custom_indicator) if not np.isnan(v)]
            }
        else:
            return jsonify({'error': 'Invalid custom indicator format'}), 400
        
        return jsonify(indicator_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
