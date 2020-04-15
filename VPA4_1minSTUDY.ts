# This is a conversion of the NinjaTrader VPA indicator.  ToS does not support directional
# triangles and diamonds, so there are some differences.  The triangles are left as is, just
# not pointing a specific direction.  The diamonds have been replaced with circles.

# On top of Bar:
#
#    * Yellow Triangle
#      High volume Downbar after an upmove on high volume indicates weakness.
#    * Blue Circle
#      Reversal possible, yesterday was high volume wide spread up bar, but today we reached 10 days high with low close wide spread down bar.
#    * Red Triangle
#      UpThrust confirmation.
#    * Blue Triangle
#      A Down Bar closing down after a Pseudo Upthrust confirms weakness.
#    * Blue Square
#      Psuedo UpThrust, A Sign of Weakness /OR/ A High Volume Up Bar closing down in a uptrend shows Distribution /OR/ No Demand.
#
#On bottom of bar:
#
#    * Aqua Triangle
#      High volume upbar closing on the high indicates strength (in short term down trend).
#    * Deep Pink Square
#      Test for supply.
#    * Green Square
#      Strength bar (either strength is showing in down trend or a supply test in up trend).
#    * Green Circle
#      Stopping volume. Normally indicates end of bearishness is nearing /OR/ No supply.
#    * Yellow Triangle
#      An Upbar closing near High after a Test confirms strength.
#    * Green Triangle
#      The previous bar saw strength coming back, This upbar confirms strength.
#
# On the median of the bar:
#
#    * Turquoise circle
#      Effort to Rise. Bullish sign.
#    * Yellow circle
#      Effort to Fall. Bearish sign.


# The NT version used a LinRegSlopeSFX indicator for determining trends. Those have been
# replaced in this ToS version with a call to the built in LinearRegressionSlope indicator.

#######
# Arguments
declare once_per_bar;
input volumeEMALength = 30;
input narrowSpreadFactor = 0.7;
input wideSpreadFactor = 1.5;
input aboveAvgVolfactor = 1.5;
input ultraHighVolfactor = 2;
input highCloseFactor = 0.70;
input lowCloseFactor = 0.25;
input colorBars = {default false, true};
input trendText = {false, default true};
input volumeDefinitions = { false, default true };
input alerts = { default false, true };

input OpenTime = 0930;
def secondsPassed = SecondsFromTime(OpenTime);
def secondRemain=floor(secondsPassed/60);
def BarSecond=  secondsPassed- secondRemain*60;
AddLabel(yes, secondsPassed);AddLabel(yes, secondRemain);AddLabel(yes, BarSecond);
#######
# Calculations

rec spread = high - low;
def median = (high + low ) / 2;
rec avgVolume = CompoundValue(volumeEMALength, ExpAverage(volume, volumeEMALength), Double.NaN);

# Calculate Volume moving average and it's standard deviation
rec sAvgVolume =  CompoundValue(volumeEMALength, Average(volume, volumeEMALength), Double.NaN);

def sAvgVolumeSTD = StDev(sAvgVolume, volumeEMALength);

# check if the vloume has been decreasing in the past two days.
def isTwoDaysLowVol = (volume < volume[1] && volume[0] < volume[2]);

# Calculate Range information
def avgSpread = WildersAverage(spread, volumeEMALength)[0];
rec isWideSpreadBar = (spread > (wideSpreadFactor * avgSpread));
rec isNarrowSpreadBar = (spread < (narrowSpreadFactor * avgSpread));

# Price information
rec isUpBar = close > close[1];
rec isDownBar = close < close[1];

# Check if the close is in the Highs/Lows/Middle of the bar.
def x1 = if (close == low) then avgSpread else (spread / (close - low));

def isUpCloseBar = (x1 < 2);
def isDownCloseBar = (x1 > 2);
def isMidCloseBar = (x1 < 2.2 && x1 > 1.8);
def isVeryHighCloseBar = (x1 < 1.35);

# Trend Definitions
rec fiveDaysSma = CompoundValue(5, Average(close, 5)[0], Double.NaN);
def LongTermTrendSlope = LinearRegressionSlope(price = fiveDaysSma, length = 30)[0];
def MiddleTermTrendSlope = LinearRegressionSlope(price = fiveDaysSma, length = 15)[0];
def ShortTermTrendSlope = LinearRegressionSlope(price = fiveDaysSma, length = 5)[0];

######################################################################
#  VSA Definitions
            
# utbar
rec isUpThrustBar = isWideSpreadBar && isDownCloseBar && ShortTermTrendSlope > 0;
# utcond1
def upThrustConditionOne = (isUpThrustBar[1] && isDownBar);
# utcond2
def upThrustConditionTwo = (isUpThrustBar[1] && isDownBar[0] && volume > volume[1]);
# utcond3
def upThrustConditionThree = (isUpThrustBar[0] && volume > 2 * sAvgVolume[0]);
# scond1
rec isConfirmedUpThrustBar = (upThrustConditionOne or upThrustConditionTwo or upThrustConditionThree);
# scond
rec isNewConfirmedUpThrustBar = (isConfirmedUpThrustBar[0] && !isConfirmedUpThrustBar[1]);

#  trbar
def reversalLikelyBar = (volume[1] > sAvgVolume[0] && isUpBar[1] && isWideSpreadBar[1] && isDownBar[0] && isDownCloseBar && isWideSpreadBar[0] && LongTermTrendSlope > 0 && high == Highest(high, 10)[0]);
            
# hutbar
rec isPseudoUpThrustBar = (isUpBar[1] && (volume[1] > aboveAvgVolfactor * sAvgVolume[0]) && isDownBar[0] && isDownCloseBar && !isWideSpreadBar[0] && !isUpThrustBar[0]);
# hutcond
def pseudoUpThrustConfirmation = (isPseudoUpThrustBar[1] && isDownBar[0] && isDownCloseBar && !isUpThrustBar[0]);

# tcbar
def weaknessBar = (isUpBar[1] && high[0] == Highest(high, 5)[0] && isDownBar[0] && (isDownCloseBar or isMidCloseBar) && volume[0] > sAvgVolume[0] && !isWideSpreadBar[0] && !isPseudoUpThrustBar[0]);

# stdn, stdn0, stdn1, stdn2
def strengthInDownTrend =  (volume[0] > volume[1] && isDownBar[1] && isUpBar[0] && (isUpCloseBar or isMidCloseBar) && ShortTermTrendSlope < 0 && MiddleTermTrendSlope < 0 && close("$Tick") - open("$Tick")>250);
def strengthInDownTrend0 = (volume[0] > volume[1] && isDownBar[1] && isUpBar[0] && (isUpCloseBar or isMidCloseBar) && ShortTermTrendSlope < 0 && MiddleTermTrendSlope < 0 && LongTermTrendSlope < 0);

def strengthInDownTrend1 = (volume[0] >  sAvgVolume[0] * aboveAvgVolfactor && isDownBar[1] && isUpBar[0] && (isUpCloseBar or isMidCloseBar) && ShortTermTrendSlope < 0 && MiddleTermTrendSlope < 0 );
def strengthInDownTrend2 = (volume[1] < sAvgVolume[0] && isUpBar[0] && isVeryHighCloseBar && volume[0] > sAvgVolume[0] && ShortTermTrendSlope < 0);

rec bycond1 = (strengthInDownTrend or strengthInDownTrend1);

# bycond
def isStrengthConfirmationBar = (isUpBar[0] && bycond1[1]);

# stvol
def stopVolBar = low[0] == Lowest(low, 5)[0] && (isUpCloseBar or isMidCloseBar) && volume[0] > aboveAvgVolfactor * sAvgVolume[0] && LongTermTrendSlope < 0;

# ndbar, nsbar
def noDemandBar = (isUpBar[0] && isNarrowSpreadBar[0] && isTwoDaysLowVol && isDownCloseBar);
def noSupplyBar = (isDownBar[0] && isNarrowSpreadBar[0] && isTwoDaysLowVol && isDownCloseBar);

# lvtbar, lvtbar1, lvtbar2
rec supplyTestBar = (isTwoDaysLowVol && low[0] < low[1] && isUpCloseBar);
def supplyTestInUpTrendBar = (volume[0] < sAvgVolume[0] && low[0] < low[1] && isUpCloseBar && LongTermTrendSlope > 0 && MiddleTermTrendSlope > 0 && isWideSpreadBar[0]);
def successfulSupplyTestBar = (supplyTestBar[1] && isUpBar[0] && isUpCloseBar);
            
# dbar
def distributionBar = (volume[0] > ultraHighVolfactor * sAvgVolume[0] && isDownCloseBar && isUpBar[0] && ShortTermTrendSlope > 0 && MiddleTermTrendSlope > 0 && !isConfirmedUpThrustBar[0] && !isUpThrustBar[0]);

# eftup, eftupfl, eftdn
def effortToMoveUpBar = (high[0] > high[1] && low[0] > low[1] && close[0] > close[1] && close[0] >= ((high[0] - low[0]) * highCloseFactor + low[0]) && spread[0] > avgSpread && volume[0] > volume[1]);
def failedEffortUpMove = (effortToMoveUpBar[1] && (isUpThrustBar[0] or upThrustConditionOne or upThrustConditionTwo or upThrustConditionThree));

def effortToMoveDownBar = (high[0] < high[1] && low[0] < low[1] && close[0] < close[1] && close[0] <= ((high[0] - low[0]) * lowCloseFactor + low[0]) && spread[0] > avgSpread && volume[0] > volume[1]);
# set the shapes on the graph

# upthurst and NOT confirmed - red square on top
plot upThrustBarPlot = if (isUpThrustBar[0] and !isNewConfirmedUpThrustBar[0]) and close <= open then (high + 4 * TickSize()) else Double.NaN;
upThrustBarPlot.SetPaintingStrategy(PaintingStrategy.LINE_VS_SQUARES);
upThrustBarPlot.SetStyle(Curve.POINTS);
upThrustBarPlot.SetDefaultColor(Color.RED);
# new confirmed upthrust bar - red triangle (down) on top
#plot isNewConfirmedUpThrustBarPlot = if isNewConfirmedUpThrustBar then (high + 4 * TickSize()) else Double.NaN;
#isNewConfirmedUpThrustBarPlot.SetPaintingStrategy(PaintingStrategy.LINE_VS_TRIANGLES);
#isNewConfirmedUpThrustBarPlot.SetDefaultColor(Color.RED);
# strength in down trend - lime square on bottom
plot strengthInDownTrendPlot = if strengthInDownTrend and close >= open then (low - 6 * TickSize()) else Double.NaN;
strengthInDownTrendPlot.SetPaintingStrategy(PaintingStrategy.LINE_VS_SQUARES);
strengthInDownTrendPlot.SetDefaultColor(Color.Yellow);
# strength in down trend - lime square on bottom
#plot strengthInDownTrend1Plot1 = if strengthInDownTrend1 and close >= open then (low - 6 * TickSize()) else Double.NaN;
#strengthInDownTrend1Plot1.SetPaintingStrategy(PaintingStrategy.LINE_VS_SQUARES);
#strengthInDownTrend1Plot1.SetDefaultColor(Color.Pink);
# supply test in up trend - lime square on bottom of the bar
plot supplyTestInUpTrendBarPlot = if supplyTestInUpTrendBar and close >= open then (low - 6 * TickSize()) else Double.NaN;
supplyTestInUpTrendBarPlot.SetPaintingStrategy(PaintingStrategy.LINE_VS_SQUARES);
supplyTestInUpTrendBarPlot.SetDefaultColor(Color.RED);
# successful test for supply - yellow triangle up on bottom of the bar
#plot successfulSupplyTestBarPlot = if successfulSupplyTestBar and close >= open then (low - 4 * TickSize()) else Double.NaN;
#successfulSupplyTestBarPlot.SetPaintingStrategy(PaintingStrategy.LINE_VS_TRIANGLES);
#successfulSupplyTestBarPlot.SetDefaultColor(Color.YELLOW);
# stopping volume green (diamond) circle at bottom of bar
plot stopVolBarPlot = if stopVolBar and close-low >0.07 then (low - 4 * TickSize()) else Double.NaN;
stopVolBarPlot.SetPaintingStrategy(PaintingStrategy.LINE_VS_POINTS);
stopVolBarPlot.SetDefaultColor(Color.GREEN);
# green triangle up at bottom of the bar
plot isStrengthConfirmationBarPlot = if isStrengthConfirmationBar and close >= open then (low - 7 * TickSize()) else Double.NaN;
isStrengthConfirmationBarPlot.SetPaintingStrategy(PaintingStrategy.LINE_VS_TRIANGLES);
isStrengthConfirmationBarPlot.SetDefaultColor(Color.GREEN);
# blue square at top of bar
plot isPseudoUpThrustBarPlot = if isPseudoUpThrustBar and close <= open then (high + 4 * TickSize()) else Double.NaN;
isPseudoUpThrustBarPlot.SetPaintingStrategy(PaintingStrategy.LINE_VS_SQUARES);
isPseudoUpThrustBarPlot.SetDefaultColor(Color.Blue);
# blue triangle (down) at top of bar
plot pseudoUpThrustConfirmationPlot = if pseudoUpThrustConfirmation then (high + 4 * TickSize()) else Double.NaN;
pseudoUpThrustConfirmationPlot.SetPaintingStrategy(PaintingStrategy.LINE_VS_TRIANGLES);
pseudoUpThrustConfirmationPlot.SetDefaultColor(Color.YELLOW);
# yellow triangle (down) at top of bar
plot weaknessBarPlot = if weaknessBar then (high + 4 * TickSize()) else Double.NaN;
weaknessBarPlot.SetPaintingStrategy(PaintingStrategy.LINE_VS_SQUARES);
weaknessBarPlot.SetDefaultColor(Color.Cyan);
# aqua triangle up at bottom of bar
#plot strengthInDownTrend2Plot = if strengthInDownTrend2 then (low - 4 * TickSize()) else Double.NaN;
#strengthInDownTrend2Plot.SetPaintingStrategy(PaintingStrategy.LINE_VS_TRIANGLES);
#strengthInDownTrend2Plot.SetDefaultColor(Color.Pink); # ????
# distribution at end of uptrend - blue square on top
plot distributionBarPlot = if distributionBar and close <= open then (high + 4 * TickSize()) else Double.NaN;
distributionBarPlot.SetPaintingStrategy(PaintingStrategy.LINE_VS_SQUARES);
distributionBarPlot.SetDefaultColor(Color.GREEN);
# supply test bar - pink square on bottom
#plot supplyTestBarPlot = if supplyTestBar and close >= open then (low - 4 * TickSize()) else Double.NaN;
#supplyTestBarPlot.SetPaintingStrategy(PaintingStrategy.LINE_VS_SQUARES);
#supplyTestBarPlot.SetDefaultColor(Color.MAGENTA);
# no demand bar - blue squre on top
#plot noDemandBarPlot = if noDemandBar and close <= open then (high + 4 * TickSize()) else Double.NaN;
#noDemandBarPlot.SetPaintingStrategy(PaintingStrategy.LINE_VS_SQUARES);
#noDemandBarPlot.SetDefaultColor(Color.Pink);
# no supply bar - lime diamond on bottom
plot noSupplyBarPlot = if noSupplyBar and close >= open then (low - 4 * TickSize()) else Double.NaN;
noSupplyBarPlot.SetPaintingStrategy(PaintingStrategy.LINE_VS_POINTS);
noSupplyBarPlot.SetDefaultColor(Color.CYAN);
# effort to move up - turquoise diamond in the median of the bar
plot effortToMoveUpBarPlot = if effortToMoveUpBar and close >= open then (median) else Double.NaN;
effortToMoveUpBarPlot.SetPaintingStrategy(PaintingStrategy.LINE_VS_POINTS);
effortToMoveUpBarPlot.SetDefaultColor(CreateColor(64, 224, 208));
# effort to move down - yellow diamond in the median of the bar
plot effortToMoveDownBarPlot = if effortToMoveDownBar and close <= open then (median) else Double.NaN;
effortToMoveDownBarPlot.SetPaintingStrategy(PaintingStrategy.LINE_VS_POINTS);
effortToMoveDownBarPlot.SetDefaultColor(Color.YELLOW);

plot NotMatch1 = if  close("$Add") < open("$Add") and close("$Tick") < open("$Tick") and close > open then (high) else Double.NaN;
NotMatch1.SetPaintingStrategy(PaintingStrategy.LINE_VS_POINTS);
NotMatch1.SetDefaultColor(Color.Black);
plot NotMatch2 = if  close("$Add") > open("$Add") and close("$Tick") > open("$Tick") and close < open then (low) else Double.NaN;
NotMatch2.SetPaintingStrategy(PaintingStrategy.LINE_VS_POINTS);
NotMatch2.SetDefaultColor(Color.Black);
#input smoothingLength = 3;
def haclose = (open + high + low + close) / 4;
def haopen = CompoundValue(1, (haopen[1] + haclose[1]) / 2, (open[1] + close[1]) / 2);

#plot squeezeUp = if haclose > haopen then (low - 2 * TickSize()) else (high + 2 * TickSize()) ;
#squeezeUp.SetPaintingStrategy(PaintingStrategy.LINE_VS_POINTS);
#squeezeUp.SetDefaultColor(Color.WHITE);
#plot ZeroLine = 0;


def SMI = StochasticMomentumIndex(40, -40, 3, 5);
def AvgSMI = ExpAverage(SMI, 3);

######################################################
# set the shapes on the graph

#plot BuyShortPlot = if ((noSupplyBar or strengthInDownTrend or supplyTestInUpTrendBar or stopVolBar or noSupplyBar ) and close >= open) or  (((isUpThrustBar[0] and !isNewConfirmedUpThrustBar[0]) or distributionBar or noDemandBar) and close <= open)  then (low - 200 * TickSize()) else Double.NaN;
#plot BuyPlot = if strengthInDownTrend  then (low - 200 * TickSize()) else Double.NaN;
#BuyShortPlot.SetPaintingStrategy(PaintingStrategy.LINE_VS_SQUARES);
#BuyShortPlot.SetDefaultColor(Color.YELLOW);
#def SlowK = StochasticSlow(80, 20, 14, 3, high, low, close, AverageType.SIMPLE);
#def RSI1 = AA_SCAN7_RSI_Lag(13);
plot BuyPlot = if (strengthInDownTrend or  (stopVolBar and close-low >0.07) or (( supplyTestInUpTrendBar or (effortToMoveUpBar and close[1]<=open[1]and close[2]<=open[2]))  and smi>smi[1] )) and close >= open  then 1 else Double.NaN;

BuyPlot.SetPaintingStrategy(PaintingStrategy.BOOLEAN_ARROW_UP);
BuyPlot.SetDefaultColor(Color.Green);

plot ShortPlot = if (isPseudoUpThrustBar or (isUpThrustBar and !isNewConfirmedUpThrustBar) or distributionBar or   pseudoUpThrustConfirmation or weaknessBar or strengthInDownTrend1 or (effortToMoveDownBar and close[2]>=open[2] and close[1]>=open[1] )) and close <= open 
and ( isPseudoUpThrustBar[1]==0) then 1 else Double.NaN;

ShortPlot .SetPaintingStrategy(PaintingStrategy.BOOLEAN_ARROW_DOWN);
ShortPlot .SetDefaultColor(Color.Red);


alert(ShortPlot[0],”Alert!”,alert.Bar,sound.Ring);
alert(BuyPlot[0],”Alert!”,alert.Bar,sound.Ring);

