# Version 0.1 (2018-04-07) First Version 
# Version 0.2 (2018-04-08) Add Trend Base Line on Open market
# Version 0.3 (2018-04-09) Add Setup Buy Point
# Version 0.4 (2018-04-10) Add Strong Market with Weak RSI for Setup Buy Point
# Version 0.5 (2018-04-18) Adjust TICK and TRIN for Setup Buy Point
# Version 0.6 (2018-04-29) Refactoring and Use the Vote with VIX, TICK, ADD for Setup Point

declare lower;
declare once_per_bar;

input BuyScore = 6;
input BuyTrendThreshold = -0.5;

input AVG_ADD_LENGTH = 3;
input AVG_VOLD_LENGTH = 3;
input AVG_TICK_LENGTH = 3;
#input tick_length = 3; #Remove

input ADD_WEIGHT = 1;
input VOLD_WEIGHT = 1;
input TICK_WEIGHT = 2;

input average_type = AverageType.EXPONENTIAL;

input OpenTime = 0930;
input HealthThreshold = 0.01;
input ResetByNewTradingDay = yes;

#### Check Study Work Correctly #####
def isInvalid = (GetAggregationPeriod() >= 86400000 and ResetByNewTradingDay == yes);
Assert(isInvalid == no , "Timeframe is over 1 day for ResetByNewTradingDay=yes");
def secondsPassed = SecondsFromTime(OpenTime);
def isNew = if secondsPassed <= 0 then ResetByNewTradingDay else no;

##### Normalize ADD and VOLD ######
def ADD_C = close("$ADD");
def AVG_ADD = Average(ADD_C, AVG_ADD_LENGTH);
def MA_ADD = MovingAverage(average_type, ADD_C / 1500, 3) ;

def VOLD_C = close("$VOLD");
def AVG_VOLD = Average(VOLD_C, AVG_VOLD_LENGTH);
def MA_VOLD = MovingAverage(average_type, VOLD_C / 100000000, 3) ;

##### TICK Positive Rate ######
def TICK_C = close("$TICK");

# TICK Positive Rate
def upCount = if (isNew == yes and TICK_C > 0) then 1 else if (isNew == yes and TICK_C < 0) then 0  else if (isNew == no and TICK_C > 0 ) then  upCount[1] + 1 else upCount[1];

def downCount = if (isNew == yes and TICK_C < 0) then 1 else if (isNew == yes and TICK_C > 0) then 0  else if (isNew == no and TICK_C < 0 ) then  downCount[1] + 1 else downCount[1];

def tick_up_rate =  (upCount / (upCount + downCount)) ;
def tick_rate = MovingAverage(AverageType.SIMPLE, tick_up_rate, 3);

#### Market Trend ####
def market_trend = (MA_ADD * ADD_WEIGHT + MA_VOLD * VOLD_WEIGHT + tick_rate * TICK_WEIGHT) / (ADD_WEIGHT + VOLD_WEIGHT + TICK_WEIGHT);
plot market_trend_line = market_trend;

market_trend_line.AssignValueColor(if  market_trend > HealthThreshold then if  tick_rate < tick_rate[1] or tick_rate < 0.5 then Color.YELLOW else Color.GREEN else if tick_rate > 0.4 and tick_rate > tick_rate[1] then Color.PINK   else Color.RED);
market_trend_line.SetLineWeight(2);

# Trend Base Line
def open_trend_base = if IsNaN(open_trend_base[1]) == yes and (market_trend) != 0 then market_trend else open_trend_base[1] ;
plot trend_base_line = open_trend_base;
trend_base_line.SetPaintingStrategy(PaintingStrategy.DASHES);
trend_base_line.SetLineWeight(1);
trend_base_line.SetDefaultColor(Color.WHITE);
#################################################################
#
#  The followings is to setup the Buy-Point and Sell-Point
#
#################################################################
input rsi_length = 13;
input rsi_symbol = "SPY";
input rsi_average_type = AverageType.WILDERS;

#### RSI ####
def price = close(rsi_symbol);
def NetChgAvg = MovingAverage(rsi_average_type, price - price[1], rsi_length);
def TotChgAvg = MovingAverage(rsi_average_type, AbsValue(price - price[1]), rsi_length);
def ChgRatio = if TotChgAvg != 0 then NetChgAvg / TotChgAvg else 0;
def RSI = 50 * (ChgRatio + 1);
def Avg_RSI = MovingAverage(AverageType.EXPONENTIAL, RSI, 3);
def Avg_RSI_LocalRegionLowest = Lowest(Avg_RSI, 3);
def isRSIUp = Avg_RSI > Average(Avg_RSI, 3) and Avg_RSI > Avg_RSI_LocalRegionLowest and Avg_RSI < 70 and Avg_RSI > Avg_RSI[1];

#### TICK ####
def TICK_O = open("$TICK");
def TICK_L = low("$TICK");

def TICK_LocalRegionLowestC = Lowest(TICK_C, 5);
def TICK_LocalRegionLowestL = Lowest(TICK_L, 5);

def isBuyPointByTICKSignal1 = TICK_LocalRegionLowestC == TICK_C[1] and TICK_C > TICK_C[1];

def isBuyPointByTICKSignal2 = TICK_LocalRegionLowestL == TICK_L and TICK_C > TICK_O;


def isBuyPointByTICK = (isBuyPointByTICKSignal1 or isBuyPointByTICKSignal2) and TICK_C[1] < -200;


#### VIX ####
def VIX_O = open("VIX");
def VIX_H = high("VIX");
def VIX_L = low("VIX");
def VIX_C = close("VIX");

def VIX_LocalRegionHighestC = Highest(VIX_C, 10);
def VIX_LocalRegionHighestH = Highest(VIX_H, 10);

def isBuyPointByVIX1 = (VIX_C[1] == VIX_LocalRegionHighestC and VIX_C < VIX_C[1] and VIX_O < VIX_C[1]);

def isBuyPointByVIX2 = ((VIX_H[1] == VIX_LocalRegionHighestH or VIX_H == VIX_LocalRegionHighestH) and (VIX_C < VIX_C[1] or VIX_O > VIX_C) );

def isBuyPointByVIX = isBuyPointByVIX1 or isBuyPointByVIX2;

#### ADD ####
def ADD_O = open("$ADD");
def ADD_H = high("$ADD");
def ADD_L = low("$ADD");

def AVG_ADD_C = Average( ADD_C , 2) ;
def AVG_ADD_LocalRegionLowestC = Lowest(ADD_C, 10);
def AVG_ADD_LocalRegionLowestL = Lowest(ADD_L, 10);

def isBuySignalByADD1 = (AVG_ADD_LocalRegionLowestC == ADD_C[1] and ADD_C > ADD_C[1] and ADD_C > ADD_O );

def isBuySignalByADD2 = (AVG_ADD_LocalRegionLowestL == ADD_L and ADD_O > ADD_C[1] and ADD_C >= ADD_O );

def isBuyPointByADD = isBuySignalByADD1 or isBuySignalByADD2  ;

#### Vote Buy Point ####
def CurrentTICKSCore = if isBuyPointByTICK then 3 else 0;
def CurrentVIXSCore = if isBuyPointByVIX then 2 else 0;
def CurrentADDScore = if isBuyPointByADD then 2 else 0;

def PreviousTICKSCore = if isBuyPointByTICK[1] then 2 else 0;
def PreviousVIXSCore = if isBuyPointByVIX[1] then 1 else 0;
def PreviousADDScore = if isBuyPointByADD[1] then 1 else 0;

def BuyPointScore = CurrentTICKSCore + CurrentVIXSCore + CurrentADDScore +  PreviousTICKSCore + PreviousVIXSCore + PreviousADDScore;

def isBuyPoint = (BuyPointScore >= BuyScore) and market_trend > BuyTrendThreshold ;

plot upSignal = if isBuyPoint  then market_trend else Double.NaN;
upSignal.SetDefaultColor(Color.GREEN );
upSignal.SetLineWeight(3);
upSignal.SetPaintingStrategy(PaintingStrategy.ARROW_UP);