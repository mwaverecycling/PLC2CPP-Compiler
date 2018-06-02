#include "%PACKAGENAME%/%CLASSNAME%.hpp"

%IMPORTS%

using namespace std;

%CLASSNAME%::%CLASSNAME%() : PLCChip(%INPUTS%, %OUTPUTS%)
{
	this->chips.resize(%CHIPS%);
	this->channels.resize(%CHANNELS%);

%INITCODE%
}
%CLASSNAME%::~%CLASSNAME%()
{
	vector<PLCChip*>::iterator chip_itr;
    for(chip_itr = this->chips.begin(); chip_itr != this->chips.end(); chip_itr++) {
        delete (*chip_itr);
    }
    vector<PLCChannel*>::iterator chan_itr;
    for(chan_itr = this->channels.begin(); chan_itr != this->channels.end(); chan_itr++) {
        delete (*chan_itr);
    }
}

void %CLASSNAME%::apply()
{
%APPLYCODE%
}