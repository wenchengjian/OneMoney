#Hint: GAMMA SCALPER
input Length=20;
#hint Length: On intraday, this is the number of days used to calculate the atr. On interday, it is the number of chart aggregation periods used to calculate atr. \n\nrev:1.2.0 05/18/2017 comment-out labels except for the ATR label \nrev: 1.1.0 05/17/2017 plot standard deviation of true range offset from hod and lod. Post a chart label with the current SDTRange.


declare upper;

#add by cwen
declare once_per_bar;
### ATR + Visual


def ATRange = if getaggregationPeriod()<aggregationPeriod.DAY then 
    MovingAverage(AverageType.WILDERS, TrueRange(high(period = AggregationPeriod.DAY), close(period = AggregationPeriod.DAY), low(period = AggregationPeriod.DAY)), Length)
    else ATR(length = Length);
def SDTRange=StDev(data = TrueRange(high(period = AggregationPeriod.DAY), close(period = AggregationPeriod.DAY), low(period = AggregationPeriod.DAY)),length=length);

plot high_std=
    if getaggregationPeriod()<aggregationPeriod.DAY then 
        high(period = AggregationPeriod.DAY) - SDTRange
    else 
        double.NAN;
high_std.setdefaultColor(color.GREEN);
high_std.setstyle(curve.MEDIUM_DASH);
high_std.setPaintingStrategy(paintingStrategy.DASHES);


plot low_std=
    if getaggregationPeriod()<aggregationPeriod.DAY then
        low(period = AggregationPeriod.DAY) + SDTRange
    else 
        double.nan;
low_std.setDefaultColor(color.RED);
low_std.setStyle(curve.MEDIUM_DASH);
low_std.setPaintingStrategy(PaintingStrategy.DASHES);


plot High_ATR = 
    if getaggregationPeriod()<aggregationPeriod.DAY then 
        high(period = AggregationPeriod.DAY) - ATRange
    else 
        highestAll(high-ATRAnge);
High_ATR.SetStyle(Curve.POINTS);
High_ATR.SetLineWeight(2);
High_ATR.SetDefaultColor(Color.GREEN);

plot Low_ATR = 
    if getaggregationPeriod()<aggregationPeriod.DAY then
        low(period = AggregationPeriod.DAY) + ATRange
    else
        lowestAll(low+Atrange);

Low_ATR.SetStyle(Curve.POINTS);
Low_ATR.SetLineWeight(2);
Low_ATR.SetDefaultColor(Color.RED);

### Dates & Count

def Days = if BarNumber() >= 1 
                then
                    if (high[1] - low[1]) > 0 
                    then Days[1] + 1
                    else Days[1]
                else Days[1] ;

def ATR_Count = if BarNumber() >= 1 
                then
                    if (high[1] - low[1]) > ATRange 
                    then ATR_Count[1] + 1
                    else ATR_Count[1]
                else ATR_Count[1] ;

def ATR_Counter = if BarNumber() >= 1
                  then
                    if (high[1] - low[1]) < ATRange
                    then ATR_Counter[1] + 1
                    else ATR_Counter[1]
                else ATR_Counter[1];

### Labels

AddLabel(yes, "ATR: $" + Round(ATRange), Color.CYAN);
AddLabel(yes, "SDTR: $"+ round(SDTRange), color.CYAN);
#AddLabel(yes, "# of Bars Trading > ATR:: " + ATR_Count, Color.WHITE);
#AddLabel(yes, "# of Bars:: " + Days, Color.WHITE);
#AddLabel(yes, Round(ATR_Count / Days) / TickSize() + "% of Bars > ATR", Color.CYAN);

