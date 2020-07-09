import pandas_datareader.data as web
from pandas_datareader.nasdaq_trader import get_nasdaq_symbols
symbols = get_nasdaq_symbols()

print(symbols.loc['IBM'])
f = web.DataReader('^DJI', 'stooq')
f[:10]

vmw = web.DataReader('VMW', 'stooq')
vmw[:10]