# Version 0.1 (2018-04-07) First Version 
# Version 0.2 (2018-04-08) Add Trend Base Line on Open market
# Version 0.3 (2018-04-09) Add Setup Buy Point
# Version 0.4 (2018-04-10) Add Strong Market with Weak RSI for Setup Buy Point
# Version 0.5 (2018-04-18) Adjust TICK and TRIN for Setup Buy Point
# Version 0.6 (2018-04-29) Refactoring and Use the Vote with VIX, TICK, ADD for Setup Buy Point
# Version 0.7 (2018-04-29) Fixed typo and Use the Vote with VIX, TICK, ADD for Setup Sell Point
# Version 0.8 (2018-05-01) Adjust Buy Point Condition
# Version 0.9 (2018-05-04) Refine the Vote with AVG LINE and add TRIN for vote
# Version 1.0 (2018-05-06) Adjust TRIN average length for avoiding incorrect signal
# Version 1.1 (2018-05-08) Add Turning Point of Trend Base Line, remove TICK_L, TICK_C checking

declare lower;
declare once_per_bar;

input BuyScore = 5;
input BuyTrendThreshold = -0.5;

input SellScore = 5;
input SellTrendThreshold = 1;

input buy_or_sell_alert = no;

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
def MA_ADD = MovingAverage(average_type, ADD_C / 1500, 5) ;

def VOLD_C = close("$VOLD");
def MA_VOLD = MovingAverage(average_type, VOLD_C / 100000000, 5) ;

##### TICK Positive Rate ######
def TICK_C = close("$TICK");

# TICK Positive Rate
def upCount = if (isNew == yes and TICK_C > 0) then 1 else if (isNew == yes and TICK_C < 0) then 0  else if (isNew == no and TICK_C > 0 ) then  upCount[1] + 1 else upCount[1];

def downCount = if (isNew == yes and TICK_C < 0) then 1 else if (isNew == yes and TICK_C > 0) then 0  else if (isNew == no and TICK_C < 0 ) then  downCount[1] + 1 else downCount[1];

def tick_up_rate =  (upCount / (upCount + downCount)) ;
def tick_rate = MovingAverage(AverageType.SIMPLE, tick_up_rate, 5);

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

def RSIThreshold = if market_trend < 0.5 then 50 else 70; 

def isRSIUp = Avg_RSI > Average(Avg_RSI, 3) and Avg_RSI > Avg_RSI_LocalRegionLowest and Avg_RSI < RSIThreshold and Avg_RSI > Avg_RSI[1];

input setup_point_avg_length = 2;

#### TICK ####
def TICK = ohlc4("$TICK");
def TICK_O = open("$TICK");
def TICK_L = low("$TICK");

def AVG_TICK = Average( TICK, setup_point_avg_length);
def MOVING_AVG_TICK = MovingAverage( AverageType.EXPONENTIAL, TICK, 5);

def TICK_LocalRegionLowest = Lowest(AVG_TICK, 5);
def TICK_LocalRegionHighest = Highest(AVG_TICK, 5);

def isBuyPointByTICK = (TICK_LocalRegionLowest == AVG_TICK[1]) and (AVG_TICK > AVG_TICK[1]) and  MOVING_AVG_TICK > MOVING_AVG_TICK[1];

def isSellPointByTICK = TICK_LocalRegionHighest == AVG_TICK[1] and AVG_TICK < AVG_TICK[1] and MOVING_AVG_TICK < MOVING_AVG_TICK[1];

#### VIX ####
def VIX=ohlc4("VIX");
def VIX_O = open("VIX");
def VIX_C = close("VIX");

def AVG_VIX = Average( VIX, setup_point_avg_length);
def MOVING_AVG_VIX = MovingAverage( AverageType.EXPONENTIAL, VIX, 5);

def VIX_LocalRegionLowest = Lowest(AVG_VIX, 10);
def VIX_LocalRegionHighest = Highest(AVG_VIX, 10);
def VIX_MovingLocalRegionHighest = Highest(MOVING_AVG_VIX, 10);

def isBuyPointByVIX = VIX_LocalRegionHighest == AVG_VIX[1] and AVG_VIX < AVG_VIX[1] and VIX_C < VIX_C[1] and VIX_C <= VIX_O and (MOVING_AVG_VIX <= MOVING_AVG_VIX[1] or VIX_MovingLocalRegionHighest == MOVING_AVG_VIX);

def isSellPointByVIX = VIX_LocalRegionLowest == AVG_VIX[1] and AVG_VIX > AVG_VIX[1] and VIX_C > VIX_C[1] and MOVING_AVG_VIX >= MOVING_AVG_VIX[1];

#### ADD ####
def ADD_L = low("$ADD");
def ADD = ohlc4("$ADD");
def AVG_ADD = Average( ADD, setup_point_avg_length);
def MOVING_AVG_ADD = MovingAverage( AverageType.EXPONENTIAL, ADD, 5);

def ADD_LocalRegionLowest = Lowest(AVG_ADD, 10);
def ADD_LocalRegionHighest = Highest(AVG_ADD, 10);

def isBuyPointByADD = ADD_LocalRegionLowest == AVG_ADD[1] and AVG_ADD > AVG_ADD[1]  and ADD_C - ADD_L > 5 and (MOVING_AVG_ADD > MOVING_AVG_ADD[1] or ADD_L > ADD_L[1] );


def isSellPointByADD = ADD_LocalRegionHighest == AVG_ADD[1] and AVG_ADD < AVG_ADD[1]  and (MOVING_AVG_ADD < MOVING_AVG_ADD[1]) ;

#### TRIN ####
def TRIN = ohlc4("$TRIN");

### For timeframe = 5 minutes
#def AVG_TRIN = Average( TRIN, 2);
#def MOVING_AVG_TRIN =  MovingAverage( AverageType.EXPONENTIAL, TRIN, 5);
#def TRIN_LocalRegionLowest = Lowest(AVG_TRIN, 10);
#def TRIN_LocalRegionHighest = Highest(AVG_TRIN, 10);

### For timeframe = 1 minute 
def AVG_TRIN = Average( TRIN, 15);
def MOVING_AVG_TRIN =  MovingAverage( AverageType.EXPONENTIAL, TRIN, 30);
def TRIN_LocalRegionLowest = Lowest(AVG_TRIN, 25);
def TRIN_LocalRegionHighest = Highest(AVG_TRIN, 25);


def isBuyPointByTRIN = (TRIN_LocalRegionHighest == AVG_TRIN[1] and AVG_TRIN < AVG_TRIN[1]  and MOVING_AVG_TRIN < MOVING_AVG_TRIN[3]);

def isSellPointByTRIN =  (TRIN_LocalRegionLowest == AVG_TRIN[1] and AVG_TRIN > AVG_TRIN[1] and MOVING_AVG_TRIN > MOVING_AVG_TRIN[3]) ;

#### Vote Buy Point ####
def TICKBuyScore = if isBuyPointByTICK then 3 else 0;
def VIXBuyScore = if isBuyPointByVIX then 2 else 0;
def ADDBuyScore = if isBuyPointByADD then 2 else 0;
def TRINBuyScore = if isBuyPointByTRIN then 2 else 0;

#### Vote Sell Point ####
def TICKSellScore = if isSellPointByTICK then 3 else 0;
def VIXSellScore = if isSellPointByVIX then 2 else 0;
def ADDSellScore = if isSellPointByADD then 2 else 0;
def TRINSellScore = if isSellPointByTRIN then 2 else 0;

def BuyPoints = TICKBuyScore + VIXBuyScore + ADDBuyScore + TRINBuyScore;
def SellPoints = TICKSellScore + VIXSellScore + ADDSellScore + TRINSellScore;

def BuyPointScore = (BuyPoints + BuyPoints[1] + BuyPoints[2] ) - (SellPoints + SellPoints[1] + SellPoints[2]);
def SellPointScore = (SellPoints + SellPoints[1] + SellPoints[2] ) - (BuyPoints + BuyPoints[1] +  BuyPoints[2] );

def isBuyPoint = (BuyPointScore >= BuyScore and isRSIUp);
plot upSignal = if isBuyPoint[1] == no and isBuyPoint then market_trend else Double.NaN;
upSignal.SetDefaultColor(Color.GREEN );
upSignal.SetLineWeight(3);
upSignal.SetPaintingStrategy(PaintingStrategy.ARROW_UP);

def LocalMarketTrendLowest = Lowest(market_trend, 15);
def isBuyPointByMarketTrend = (market_trend[1] == LocalMarketTrendLowest) and (market_trend > market_trend[1]) and ( isRSIUp);

plot upMarketTrendSignal = if  isBuyPointByMarketTrend then market_trend else Double.NaN;
upMarketTrendSignal.SetDefaultColor(Color.YELLOW );
upMarketTrendSignal.SetLineWeight(3);
upMarketTrendSignal.SetPaintingStrategy(PaintingStrategy.ARROW_UP);

def isSellPoint = (SellPointScore >= SellScore) and market_trend < market_trend[1] ;
plot downSignal = if isSellPoint[1] == no and isSellPoint  then market_trend else Double.NaN;
downSignal.SetDefaultColor(Color.RED );
downSignal.SetLineWeight(3);
downSignal.SetPaintingStrategy(PaintingStrategy.ARROW_DOWN);

alert(isBuyPointByMarketTrend == yes and isBuyPoint ,"Buy Point",alert.BAR,sound.DING);
alert(buy_or_sell_alert == yes and isBuyPoint ,"Buy Point",alert.BAR,sound.DING);
alert(buy_or_sell_alert == yes and isSellPoint ,"Buy Point",alert.BAR,sound.DING);