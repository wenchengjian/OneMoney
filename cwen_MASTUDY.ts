input length = 3;
input datahigh = high;
input datalow = low;

def k3_high_MA = MovingAverage(AverageType.SIMPLE, datahigh, length);

def k3_low_MA = MovingAverage(AverageType.SIMPLE, datalow, length);

plot k3_high_MA_line = k3_high_MA;
k3_high_MA_line.setDefaultColor(Color.RED);
k3_high_MA_line.setLineWeight(2);
plot k3_low_MA_line = k3_low_MA;
k3_low_MA_line.setDefaultColor(Color.GREEN);
k3_high_MA_line.setLineWeight(2);
