#3根K线的高点和低点均线

input swing_back = 8;
input swing_forward = 2;
input maxbars = 30;
input showlevels = Yes;
input Alert = No;

def sb = swing_back;
def sf = swing_forward;
def na = double.nan;


def lfor = Lowest(low, sf)[-sf];
def lback = Lowest(low, sb)[1];
def swinglow = if low < lfor and low <= lback then 1 else 0;
plot sl = if swinglow then low else na;
    sl.SetStyle(curve.points);
    sl.SetLineWeight(5);
    sl.SetDefaultColor(color.Green);

def hfor = Highest(high, sf)[-sf];
def hback = Highest(high, sb)[1];
def swinghigh = if high > hfor and high >= hback then 1 else 0;
plot sh = if swinghigh then high else na; 
    sh.SetStyle(curve.points);
    sh.SetLineWeight(5);
    sh.SetDefaultColor(color.red);

rec sh_count;
rec sl_count;
plot sh_c_plot_val;
plot sl_c_plot_val;

if swinghigh
then {
    sh_count = if sh_count[1]>50 then 1 else sh_count[1]+1;
    sh_c_plot_val = sh_count;
    sl_count = 0;
    sl_c_plot_val = double.nan;
} else {
    if swinglow
    then {
        sl_count = if sl_count[1]>50 then 1 else sl_count[1]+1;
        sl_c_plot_val = sl_count;
        sh_count = 0;
        sh_c_plot_val = double.nan;
    } else {
        sh_count = sh_count[1];
        sl_count = sl_count[1];
        sh_c_plot_val = double.nan;
        sl_c_plot_val = double.nan;
    }
};


sh_c_plot_val.setPaintingStrategy(paintingStrategy.VALUES_ABOVE);
sh_c_plot_val.setdefaultcolor(color.red);
sh_c_plot_val.setlineWeight(3);
sl_c_plot_val.setPaintingStrategy(paintingStrategy.VALUES_below);
sl_c_plot_val.setdefaultcolor(color.Green);


# Extensions 

rec lsl = if IsNaN(close[-sf]) then lsl[1] else if swinglow then low else lsl[1];
rec lsh = if IsNaN(close[-sf]) then lsh[1] else if swinghigh then high else lsh[1];

def bn = barNumber();
rec hcount = if swinghigh then 1 else hcount[1] + 1;
rec lcount = if swinglow then 1 else lcount[1] + 1;

plot lasthigh = if hcount<=maxbars AND IsNaN(close[-sf]) then lsh[1] else if hcount > maxbars then na else if hcount < 2 then na else lsh;
plot lastlow = if lcount<=maxbars AND IsNaN(close[-sf]) then lsl[1] else if lcount > maxbars then na else if lcount < 2 then na else lsl;

lasthigh.SetStyle(curve.SHORT_DASH);
lasthigh.SetDefaultColor(color.Red);
lasthigh.setHiding(!showlevels);

lastlow.SetStyle(curve.sHORT_DASH);
lastlow.SetDefaultColor(color.Green);
lastlow.setHiding(!showlevels);

alert(sh and Alert,"SwingHigh", alert.BAR,sound.ring);
alert(sl and Alert,"SwingLow", alert.BAR,sound.ring);

input length = 3;
input datahigh = high;
input datalow = low;

def k3_high_MA = MovingAverage(AverageType.SIMPLE, datahigh, length);

def k3_low_MA = MovingAverage(AverageType.SIMPLE, datalow, length);

plot k3_high_MA_line = k3_high_MA;
k3_high_MA_line.setDefaultColor(Color.RED);
k3_high_MA_line.setLineWeight(2);
plot k3_low_MA_line = k3_low_MA;
k3_low_MA_line.setDefaultColor(Color.YELLOW);
k3_high_MA_line.setLineWeight(2);