#
# The cost line is designed by 米谷 
#
declare once_per_bar;

input times = 10;
input avg_length = 20;
input ShowCost_Lines = yes;

def avgVolume = Average(volume, avg_length);
def stdAvgVolume = StDev(avgVolume, avg_length);
def diffRateVolume = (volume - avgVolume) / stdAvgVolume;


def maxDiffRate1 = Max(diffRateVolume[0], diffRateVolume[1]);
def maxDiffRate2 = Max(diffRateVolume[2], diffRateVolume[3]);
def maxDiffRate3 = Max(maxDiffRate1, maxDiffRate2);


def m = MidBodyVal();
def n = if (diffRateVolume > times) and (diffRateVolume >= maxDiffRate3)   then m else n[1];

plot CT_Lines = if n == 0 then Double.NaN else if ShowCost_Lines then n else Double.NaN;

CT_Lines.SetPaintingStrategy(PaintingStrategy.HORIZONTAL);
CT_Lines.SetDefaultColor(Color.VIOLET);
CT_Lines.SetLineWeight(2);

