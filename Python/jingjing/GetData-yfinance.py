import matplotlib.pyplot as plt
import seaborn as sns
import matplotlib.pyplot as plt
import warnings; warnings.simplefilter('ignore') #忽略可能会出现的警告信息，警告并不是错误，可以忽略；
import pandas as pd
import numpy as np
import os
import xlrd
import yfinance as yf
yf.pdr_override()
pd.core.common.is_list_like = pd.api.types.is_list_like
import pandas_datareader.data as web


stocklist = pd.read_excel('/Users/cwen/Desktop/qt/IBD 50 DB.xls',sheet_name='Sheet1',index=False, encoding='utf8')
Symbol=stocklist['Symbol']

# 获取实时数据
writer = pd.ExcelWriter('IBDresult.xlsx')
df = None

for symbol_name in Symbol:
    try:
        stock_quote = web.get_data_yahoo(symbol_name, start='2017-01-01')
        stock_quote.insert(0, 'symbol', symbol_name)
        stock_quote.to_excel(excel_writer=writer, sheet_name=symbol_name, index=True)
    except Exception as e:
        print(symbol_name)
        cannotgetlist = cannotgetlist + symbol_name + " "
        print(e)
        continue
notsave = list(cannotgetlist)
while len(notsave) > 0:
    try:
        stock_quote = web.get_data_yahoo(notsave[0], start='2017-01-01')
        stock_quote.insert(0, 'symbol', notsave[0])
        stock_quote.to_excel(excel_writer=writer, sheet_name=notsave[0], index=True)
        failname = notsave.pop(notsave[0])
    except Exception as e:
        print(failname)
        notsave.append(failname)

print("保存成功！")
writer.save()
