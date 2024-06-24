import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const MeetingTimeDateSelection = ({ onTimeSelect }) => {
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    const handleStartTimeChange = (e) => {
        setStartTime(e.target.value);
        onTimeSelect(e.target.value, endTime);
    };

    const handleEndTimeChange = (e) => {
        setEndTime(e.target.value);
        onTimeSelect(startTime, e.target.value);
    };

    return (
        <div className='flex gap-10'>
            <div className='mt-3'>
                <h2>Start Time</h2>
                <Input
                    type="time"
                    value={startTime}
                    onChange={handleStartTimeChange}
                />
            </div>
            <div className='mt-3'>
                <h2>End Time</h2>
                <Input
                    type="time"
                    value={endTime}
                    onChange={handleEndTimeChange}
                />
            </div>
        </div>
    );
};

export default MeetingTimeDateSelection;
