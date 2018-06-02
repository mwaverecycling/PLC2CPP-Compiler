#ifndef %HEADERNAME%_HPP
#define %HEADERNAME%_HPP

#include <vector>
#include "PLCChip.hpp"
#include "PLCChannel.hpp"

using namespace std;

class %CLASSNAME% : public PLCChip
{
	public:
		%CLASSNAME%();
		~%CLASSNAME%();
	
	private:
		virtual void apply() override;
		vector<PLCChip*> chips;
		vector<PLCChannel*> channels;
};

#endif // %HEADERNAME%_HPP