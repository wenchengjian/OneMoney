#designed by cwen, 2018-4-2

#declare lower;
#declare once_per_bar;
#AddVerticalLine(secondsFromTime(time)[1] < 0 && secondsFromTime(time) >= 0, time);
declare once_per_bar;

input length = 10;
input threshold_up = 1000;
input threshold_down = -1000;
input zero_line = 0;


def avgTick = Average(close, length);
plot avgTickLine = avgTick;
avgTickLine.SetDefaultColor(Color.YELLOW);
avgTickLine.SetLineWeight(2);

plot zeroline = zero_line;
zeroline.SetDefaultColor(Color.WHITE);
zeroline.SetLineWeight(1);

plot thres_up = threshold_up;
thres_up.SetDefaultColor(Color.RED);
thres_up.SetLineWeight(2);

plot thres_down = threshold_down;
thres_down.SetDefaultColor(Color.GREEN);
thres_down.SetLineWeight(2);