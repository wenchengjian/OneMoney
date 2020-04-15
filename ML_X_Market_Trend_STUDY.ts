declare lower;
declare once_per_bar;

input length = 3;
input tick_length = 3;
input add_weight = 1;
input vold_weight = 1;
input tick_weight = 2;

input OpenTime = 0930;
input HealthThreshold = 0.01;
input ResetByNewTradingDay = yes;

input hide_add = no;
input hide_vold = no;
input hide_tick_rate_line = no;


# Declare Variables
def add_val = close("$ADD");
def vold_val = close("$VOLD");
def tick_val = close("$TICK");

def add_normalize = 1000;
def vold_normalize = 100000000;
def tick_normalize = 1000;

##### Normalize ADD ######
def normalized_add = add_val / add_normalize;
def avg_add = Average(add_val, length);
def changed_add = normalized_add + avg_add[length];
def mv_add = MovingAverage( AverageType.EXPONENTIAL, changed_add) / add_normalize;
plot add_normalize_line = mv_add;
add_normalize_line.SetDefaultColor(Color.LIGHT_ORANGE);
add_normalize_line.SetHiding(hide_add);

##### Normalize VOLD ######
def normalized_vold = vold_val / vold_normalize;
# To generate short $VOLD LINE
def avg_vold = Average(vold_val, length);
def changed_vold = normalized_vold + avg_vold[length];
def mv_vold = MovingAverage( AverageType.EXPONENTIAL, changed_vold) / vold_normalize;
plot vold_normalize_line = mv_vold;
vold_normalize_line.SetDefaultColor(Color.PINK);
vold_normalize_line.SetHiding(hide_vold);


##### Normalize TICK ######

def aggregationPeriod = GetAggregationPeriod();

def isInvalid = (aggregationPeriod >= 86400000 and ResetByNewTradingDay == yes);
Assert(isInvalid == no , "Timeframe is over 1 day for ResetByNewTradingDay=yes");

def secondsPassed = SecondsFromTime(OpenTime);
def isNew = if secondsPassed <= 0 then ResetByNewTradingDay else no;

def value = tick_val;

# Average Tick
def barIdx = if (isNew == yes ) then 1 else barIdx[1] + 1;
def totalTickVal = if (isNew == yes ) then value else  totalTickVal[1] + value;
def avgTickVal = totalTickVal / barIdx;


# Positive Rate
def upCount = if (isNew == yes and value > 0) then 1 else if (isNew == yes and value < 0) then 0  else if (isNew == no and value > 0 ) then  upCount[1] + 1 else upCount[1];

def downCount = if (isNew == yes and value < 0) then 1 else if (isNew == yes and value > 0) then 0  else if (isNew == no and value < 0 ) then  downCount[1] + 1 else downCount[1];

def rate =  (upCount / (upCount + downCount)) ;
def tick_rate = MovingAverage(AverageType.SIMPLE, rate, tick_length);

plot tickRateLine = tick_rate;
tickRateLine.SetDefaultColor(Color.BLUE);

tickRateLine.SetLineWeight(2);
tickRateLine.SetHiding(hide_tick_rate_line);


# Market Trend Line
def market_trend_value = (mv_add*add_weight + mv_vold * vold_weight + tick_Rate * tick_weight) / (add_weight+vold_weight+tick_weight);
plot market_trend_line = market_trend_value;



market_trend_line.AssignValueColor(if  market_trend_value > HealthThreshold then if tick_Rate < 0.5 then Color.YELLOW else Color.GREEN else if tick_Rate > 0.5 then Color.PINK else Color.RED);

market_trend_line.SetLineWeight(2);


# Trend Base Line
def open_trend_base = if IsNaN(open_trend_base[1]) == yes and (market_trend_value) != 0 then market_trend_value else open_trend_base[1] ;
plot trend_base_line = open_trend_base;
trend_base_line.setPaintingStrategy(PaintingStrategy.DASHES);
trend_base_line.SetLineWeight(1);
trend_base_line.setDefaultColor(Color.WHITE);