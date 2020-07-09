#
# TD Ameritrade IP Company, Inc. (c) 2007-2018
#

declare lower;
declare zerobase;

input length = 10;
input health_threshold = 100;

plot tickBar = close;
tickBar.SetPaintingStrategy(PaintingStrategy.HISTOGRAM);
tickBar.SetLineWeight(1);
tickBar.DefineColor("Up", Color.UPTICK);
tickBar.DefineColor("Down", Color.DOWNTICK);
tickBar.AssignValueColor(if close > 400 then tickBar.Color("Up") else if close < -400 then tickBar.Color("Down") else GetColor(1));


def avgTick = Average(close, length);
plot avgTickLine = avgTick;

avgTickLine.SetDefaultColor(Color.YELLOW);
avgTickLine.SetLineWeight(2);


plot healthLine = health_threshold;
healthLine.SetDefaultColor(Color.RED);
healthLine.SetLineWeight(2);

plot downSignal = Crosses(avgTickLine, health_threshold, CrossingDirection.below);
downSignal.SetDefaultColor(Color.RED);
downSignal.SetPaintingStrategy(PaintingStrategy.BOOLEAN_ARROW_DOWN);
downSignal.SetLineWeight(2);


plot upSignal = Crosses(avgTickLine, health_threshold, CrossingDirection.above);
upSignal.SetDefaultColor(Color.GREEN);
upSignal.SetPaintingStrategy(PaintingStrategy.BOOLEAN_ARROW_UP);
upSignal.SetLineWeight(2);

