# Version 0.1 (2018-04-07) First Version 
# Version 0.2 (2018-04-08) Add Trend Base Line on Open market
# Version 0.3 (2018-04-09) Add Setup Buy Point
# Version 0.4 (2018-04-10) Add Strong Market with Weak RSI for Setup Buy Point
# Version 0.5 (2018-04-18) Adjust TICK and TRIN for Setup Buy Point
# Version 0.6 (2018-04-29) Refactoring and Use the Vote with VIX, TICK, ADD for Setup Buy Point
# Version 0.7 (2018-04-29) Fixed typo and Use the Vote with VIX, TICK, ADD for Setup Sell Point
# Version 0.8 (2018-05-01) Adjust Buy Point Condition


declare lower;
declare once_per_bar;

input BuyScore = 6;
input BuyTrendThreshold = -0.5;

input SellScore = 4;
input SellTrendThreshold = 1;

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
def TICK_H = high("$TICK");

def TICK_LocalRegionLowestC = Lowest(TICK_C, 5);
def TICK_LocalRegionLowestL = Lowest(TICK_L, 5);

def TICK_LocalRegionHighestC = Highest(TICK_C, 5);
def TICK_LocalRegionHighestH = Highest(TICK_H, 5);

def isBuyPointByTICK1 = TICK_LocalRegionLowestC == TICK_C[1] and TICK_C > TICK_C[1];
def isBuyPointByTICK2 = (TICK_LocalRegionLowestL == TICK_L) and TICK_C > TICK_O;
def isBuyPointByTICK3 = (TICK_LocalRegionLowestL == TICK_L[1]) and TICK_C > TICK_O;
def isBuyPointByTICK4 = (TICK_C > TICK_O) and (TICK_C - TICK_O) >= 300;
def isBuyPointByTICK = (isBuyPointByTICK1 or isBuyPointByTICK2 or isBuyPointByTICK3 or isBuyPointByTICK4) and TICK_C[1] < -200;

def isSellPointByTICK1 = TICK_LocalRegionHighestC == TICK_C[1] and TICK_C < TICK_C[1];
def isSellPointByTICK2 = (TICK_LocalRegionHighestH == TICK_H) and TICK_C < TICK_O;
def isSellPointByTICK = (isSellPointByTICK1 or isSellPointByTICK2) and TICK_C[1] > 200;


#### VIX ####
def VIX_O = open("VIX");
def VIX_H = high("VIX");
def VIX_L = low("VIX");
def VIX_C = close("VIX");

def VIX_LocalRegionLowestC = Lowest(VIX_C, 10);
def VIX_LocalRegionLowestL = Lowest(VIX_L, 10);
def VIX_LocalRegionHighestC = Highest(VIX_C, 10);
def VIX_LocalRegionHighestH = Highest(VIX_H, 10);


def isBuyPointByVIX1 = (VIX_C[1] == VIX_LocalRegionHighestC and VIX_C < VIX_C[1] and VIX_O < VIX_C[1]);
def isBuyPointByVIX2 = ((VIX_H[1] == VIX_LocalRegionHighestH or VIX_H == VIX_LocalRegionHighestH) and (VIX_C < VIX_C[1] or VIX_O > VIX_C) );
def isBuyPointByVIX = isBuyPointByVIX1 or isBuyPointByVIX2;

def isSellPointByVIX1 = (VIX_C[1] == VIX_LocalRegionLowestC and VIX_C > VIX_C[1] and VIX_O > VIX_C[1]);
def isSellPointByVIX2 = ((VIX_L[1] == VIX_LocalRegionLowestL or VIX_L == VIX_LocalRegionLowestL) and (VIX_C > VIX_C[1] or VIX_O < VIX_C) );
def isSellPointByVIX = isSellPointByVIX1 or isSellPointByVIX2;

#### ADD ####
def ADD_O = open("$ADD");
def ADD_H = high("$ADD");
def ADD_L = low("$ADD");

def ADD_LocalRegionLowestC = Lowest(ADD_C, 10);
def ADD_LocalRegionLowestL = Lowest(ADD_L, 10);
def ADD_LocalRegionHighestC = Highest(ADD_C, 10);
def ADD_LocalRegionHighestH = Highest(ADD_H, 10);


def isBuyPointByADD1 = (ADD_LocalRegionLowestC == ADD_C[1] and ADD_C > ADD_C[1] and ADD_C > ADD_O );
def isBuyPointByADD2 = (ADD_LocalRegionLowestL == ADD_L and ADD_O > ADD_C[1] and ADD_C >= ADD_O );
def isBuyPointByADD = isBuyPointByADD1 or isBuyPointByADD2  ;

def isSellPointByADD1 = (ADD_LocalRegionHighestC == ADD_C[1] and ADD_C < ADD_C[1] and ADD_C < ADD_O );
def isSellPointByADD2 = (ADD_LocalRegionHighestH == ADD_H and ADD_O < ADD_C[1] and ADD_C < ADD_O );
def isSellPointByADD = isSellPointByADD1 or isSellPointByADD2  ;

#### Vote Buy Point ####
def CurrentTICKBuyScore = if isBuyPointByTICK then 3 else 0;
def CurrentVIXBuyScore = if isBuyPointByVIX then 2 else 0;
def CurrentADDBuyScore = if isBuyPointByADD then 2 else 0;

def PreviousTICKBuyScore = if isBuyPointByTICK[1] then 2 else 0;
def PreviousVIXBuyScore = if isBuyPointByVIX[1] then 1 else 0;
def PreviousADDBuyScore = if isBuyPointByADD[1] then 1 else 0;

def BuyPointScore = CurrentTICKBuyScore + CurrentVIXBuyScore + CurrentADDBuyScore +  PreviousTICKBuyScore + PreviousVIXBuyScore + PreviousADDBuyScore;

def isBuyPoint = (BuyPointScore >= BuyScore) and market_trend > BuyTrendThreshold ;

plot upSignal = if isBuyPoint  then market_trend else Double.NaN;
upSignal.SetDefaultColor(Color.GREEN );
upSignal.SetLineWeight(3);
upSignal.SetPaintingStrategy(PaintingStrategy.ARROW_UP);


#### Vote Sell Point ####
def CurrentTICKSellScore = if isSellPointByTICK then 3 else 0;
def CurrentVIXSellScore = if isSellPointByVIX then 2 else 0;
def CurrentADDSellScore = if isSellPointByADD then 2 else 0;

def PreviousTICKSellScore = if isSellPointByTICK[1] then 2 else 0;
def PreviousVIXSellScore = if isSellPointByVIX[1] then 2 else 0;
def PreviousADDSellScore = if isSellPointByADD[1] then 1 else 0;

def SellPointScore = CurrentTICKSellScore + CurrentVIXSellScore + CurrentADDSellScore +  PreviousTICKSellScore + PreviousVIXSellScore + PreviousADDSellScore;

def isSellPoint = (SellPointScore >= SellScore) and market_trend < SellTrendThreshold ;

plot downSignal = if isSellPoint  then market_trend else Double.NaN;
downSignal.SetDefaultColor(Color.RED );
downSignal.SetLineWeight(3);
downSignal.SetPaintingStrategy(PaintingStrategy.ARROW_DOWN);


#alert(isBuyPoint,"Buy Point",alert.BAR,sound.DING);