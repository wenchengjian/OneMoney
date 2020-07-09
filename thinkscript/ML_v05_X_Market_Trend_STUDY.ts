# Version 0.1 (2018-04-07) First Version 
# Version 0.2 (2018-04-08) Add Trend Base Line on Open market
# Version 0.3 (2018-04-09) Add Setup Buy Point
# Version 0.4 (2018-04-10) Add Strong Market with Weak RSI for Setup Buy Point
# Version 0.5 (2018-04-18) Adjust TICK and TRIN for Setup Buy Point

declare lower;
declare once_per_bar;

input add_length = 3;
input vold_length = 3;
input tick_length = 3;
input add_weight = 1;
input vold_weight = 1;
input tick_weight = 2;
input average_type = AverageType.EXPONENTIAL;

input OpenTime = 0930;
input HealthThreshold = 0.01;
input ResetByNewTradingDay = yes;

# Declare Variables
def add_val = close("$ADD");
def vold_val = close("$VOLD");
def tick_val = close("$TICK");

def add_normalize = 1500;
def vold_normalize = 100000000;
def tick_normalize = 1500;

##### Normalize ADD ######
def normalized_add = add_val / add_normalize;
def avg_add = Average(add_val, add_length);
def changed_add = normalized_add + avg_add[add_length];
def mv_add = MovingAverage(average_type, changed_add) / add_normalize;
plot add_normalize_line = mv_add;
add_normalize_line.SetDefaultColor(Color.LIGHT_ORANGE);
add_normalize_line.SetHiding(yes);

##### Normalize VOLD ######
def normalized_vold = vold_val / vold_normalize;
def avg_vold = Average(vold_val, vold_length);
def changed_vold = normalized_vold + avg_vold[vold_length];
def mv_vold = MovingAverage(average_type, changed_vold) / vold_normalize;
plot vold_normalize_line = mv_vold;
vold_normalize_line.SetDefaultColor(Color.PINK);
vold_normalize_line.SetHiding(yes);


##### Normalize TICK ######
def aggregationPeriod = GetAggregationPeriod();

def isInvalid = (aggregationPeriod >= 86400000 and ResetByNewTradingDay == yes);
Assert(isInvalid == no , "Timeframe is over 1 day for ResetByNewTradingDay=yes");

def secondsPassed = SecondsFromTime(OpenTime);
def isNew = if secondsPassed <= 0 then ResetByNewTradingDay else no;

def value = tick_val;

def barIdx = if (isNew == yes ) then 1 else barIdx[1] + 1;

# TICK Positive Rate
def upCount = if (isNew == yes and value > 0) then 1 else if (isNew == yes and value < 0) then 0  else if (isNew == no and value > 0 ) then  upCount[1] + 1 else upCount[1];

def downCount = if (isNew == yes and value < 0) then 1 else if (isNew == yes and value > 0) then 0  else if (isNew == no and value < 0 ) then  downCount[1] + 1 else downCount[1];

def rate =  (upCount / (upCount + downCount)) ;
def tick_rate = MovingAverage(AverageType.SIMPLE, rate, tick_length);

# Market Trend Line
def market_trend_value = (mv_add * add_weight + mv_vold * vold_weight + tick_rate * tick_weight) / (add_weight + vold_weight + tick_weight);
plot market_trend_line = market_trend_value;

market_trend_line.AssignValueColor(if  market_trend_value > HealthThreshold then if  tick_rate < tick_rate[1] or tick_rate < 0.5 then Color.YELLOW else Color.GREEN else if tick_rate > 0.4 and tick_rate > tick_rate[1] then Color.PINK   else Color.RED);
market_trend_line.SetLineWeight(2);

# Trend Base Line
def open_trend_base = if IsNaN(open_trend_base[1]) == yes and (market_trend_value) != 0 then market_trend_value else open_trend_base[1] ;
plot trend_base_line = open_trend_base;
trend_base_line.SetPaintingStrategy(PaintingStrategy.DASHES);
trend_base_line.SetLineWeight(1);
trend_base_line.SetDefaultColor(Color.WHITE);

###########
input rsi_length = 13;
input over_Bought = 70;
input over_Sold = 37;
#input symbol = "SPY";
input rsi_average_type = AverageType.WILDERS;

#### RSI ####
def price = close("SPY");
def NetChgAvg = MovingAverage(rsi_average_type, price - price[1], rsi_length);
def TotChgAvg = MovingAverage(rsi_average_type, AbsValue(price - price[1]), rsi_length);
def ChgRatio = if TotChgAvg != 0 then NetChgAvg / TotChgAvg else 0;
def RSI = 50 * (ChgRatio + 1);
def Avg_RSI = Average(RSI, 3);
def isRSIUp = Avg_RSI > Lowest(Avg_RSI[1], 3) and Avg_RSI < 50 and Avg_RSI > Avg_RSI[1];

#### Buy Point ####
def TICK_O = open("$TICK");
def TICK_C = close("$TICK");
def TICK_H = high("$TICK");
def TICK_L = low("$TICK");
def TRIN_C = close("$TRIN");

def isTRINDown = TRIN_C < TRIN_C[1];
def localLowest = Lowest(TICK_C, 5);
def isStartUp = TICK_C != localLowest and TICK_C > TICK_C[1] and TICK_L > TICK_C[1] and TICK_C > TICK_O[1];

def is_buy =isStartUp and isRSIUp and isTRINDown ;

plot upSignal = if is_buy then market_trend_value else Double.NaN;
upSignal.SetDefaultColor(Color.GREEN);
upSignal.SetLineWeight(2);
upSignal.SetPaintingStrategy(PaintingStrategy.ARROW_UP);
