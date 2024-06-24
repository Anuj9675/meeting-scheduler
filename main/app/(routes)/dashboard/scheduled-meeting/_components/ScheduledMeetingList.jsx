import React, { useEffect, useState } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/config/FirebaseConfig';
import { toast } from 'sonner';

const ScheduledMeetingList = () => {
    const [meetings, setMeetings] = useState([]);
    const db = getFirestore(app);

    useEffect(() => {
        const fetchMeetings = async () => {
            try {
                const q = query(collection(db, 'meetings'));
                const querySnapshot = await getDocs(q);
                const fetchedMeetings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setMeetings(fetchedMeetings);
            } catch (error) {
                toast.error('Failed to fetch meetings');
                console.error('Error fetching meetings:', error);
            }
        };

        fetchMeetings();
    }, [db]);

    const upcomingMeetings = meetings.filter(meeting => new Date(meeting.startTime) > new Date());
    const expiringMeetings = meetings.filter(meeting => new Date(meeting.endTime) < new Date());

    return (
        <div>
            <h2 className='font-bold text-2xl'>Upcoming Meetings</h2>
            <ul>
                {upcomingMeetings.map(meeting => (
                    <li key={meeting.id}>
                        <p>{meeting.title}</p>
                        <p>{new Date(meeting.startTime).toLocaleString()}</p>
                    </li>
                ))}
            </ul>

            <h2 className='font-bold text-2xl mt-10'>Expiring Meetings</h2>
            <ul>
                {expiringMeetings.map(meeting => (
                    <li key={meeting.id}>
                        <p>{meeting.title}</p>
                        <p>{new Date(meeting.endTime).toLocaleString()}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ScheduledMeetingList;
