"use client"
import { Button } from '@/components/ui/button';
import { CalendarCheck, Clock, LoaderIcon, MapPin, Timer } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import TimeDateSelection from './TimeDateSelection';
import UserFormInfo from './UserFormInfo';
import { collection, doc, getDocs, getFirestore, query, setDoc, where } from 'firebase/firestore';
import { app } from '@/config/FirebaseConfig';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import Plunk from '@plunk/node';
import { render } from '@react-email/render';
import Email from '@/emails';

function MeetingTimeDateSelection({ eventInfo, businessInfo }) {
    const [date, setDate] = useState(new Date());
    const [timeSlots, setTimeSlots] = useState([]);
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
    const [selectedTime, setSelectedTime] = useState('');
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userNote, setUserNote] = useState('');
    const [prevBooking, setPrevBooking] = useState([]);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const db = getFirestore(app);
    const plunk = new Plunk(process.env.NEXT_PUBLIC_PLUNK_API_KEY);

    useEffect(() => {
        if (eventInfo?.duration) {
            createTimeSlots(eventInfo.duration, date);
        }
    }, [eventInfo, date]);

    useEffect(() => {
        if (date) {
            fetchPrevBookings(date);
        }
    }, [date]);

    useEffect(() => {
        filterAvailableTimeSlots();
    }, [timeSlots, prevBooking]);

    const createTimeSlots = (interval, selectedDate) => {
        const startTime = 8 * 60; // 8 AM in minutes
        const endTime = 22 * 60; // 10 PM in minutes
        const now = new Date();
        let startMinutes = startTime;

        // Adjust start time for today
        if (selectedDate.getDate() === now.getDate()) {
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            startMinutes = Math.max(startTime, Math.ceil(currentMinutes / interval) * interval);
        }

        const totalSlots = (endTime - startMinutes) / interval;
        const slots = Array.from({ length: totalSlots }, (_, i) => {
            const totalMinutes = startMinutes + i * interval;
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            const formattedHours = hours > 12 ? hours - 12 : hours; // Convert to 12-hour format
            const period = hours >= 12 ? 'PM' : 'AM';
            return `${String(formattedHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
        });

        setTimeSlots(slots);
    };

    const handleDateChange = (selectedDate) => {
        setDate(selectedDate);
        createTimeSlots(eventInfo.duration, selectedDate);
    };

    const fetchPrevBookings = async (selectedDate) => {
        const q = query(collection(db, 'ScheduledMeetings'),
            where('selectedDate', '==', selectedDate.toISOString().slice(0, 10)),
            where('eventId', '==', eventInfo.id));

        const querySnapshot = await getDocs(q);
        const bookedSlots = querySnapshot.docs.map(doc => doc.data().selectedTime);

        setPrevBooking(bookedSlots);
    };

    const filterAvailableTimeSlots = () => {
        const filteredSlots = timeSlots.filter(slot => !prevBooking.includes(slot));
        setAvailableTimeSlots(filteredSlots);
    };

    const handleScheduleEvent = async () => {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        if (!regex.test(userEmail)) {
            toast('Enter a valid email address');
            return;
        }

        setLoading(true);
        const docId = Date.now().toString();
        const scheduledMeeting = {
            businessName: businessInfo.businessName,
            businessEmail: businessInfo.email,
            selectedTime: selectedTime,
            selectedDate: date,
            formatedDate: format(date, 'PPP'),
            formatedTimeStamp: format(date, 't'),
            duration: eventInfo.duration,
            locationUrl: eventInfo.locationUrl,
            eventId: eventInfo.id,
            id: docId,
            userName: userName,
            userEmail: userEmail,
            userNote: userNote
        };

        try {
            await setDoc(doc(db, 'ScheduledMeetings', docId), scheduledMeeting);
            toast('Meeting Scheduled successfully!');
            sendConfirmationEmail(userName);
        } catch (error) {
            console.error("Error scheduling meeting: ", error);
            toast('Failed to schedule meeting');
        } finally {
            setLoading(false);
        }
    };

    const sendConfirmationEmail = async (userName) => {
        const emailHtml = render(<Email
            businessName={businessInfo?.businessName}
            date={format(date, 'PPP')}
            duration={eventInfo?.duration}
            meetingTime={selectedTime}
            meetingUrl={eventInfo.locationUrl}
            userFirstName={userName}
        />);

        try {
            const response = await plunk.emails.send({
                to: userEmail,
                subject: "Meeting Schedule Details",
                body: emailHtml,
            });
            console.log("Email sent successfully:", response);
            router.push('/confirmation');
        } catch (error) {
            console.error("Error sending email: ", error);
            toast('Failed to send email notification');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='p-5 py-10 shadow-lg m-5 border-t-8 mx-10 md:mx-26 lg:mx-56 my-10'
            style={{ borderTopColor: eventInfo?.themeColor }}>
            <Image src='/Logo.png' alt='logo' width={150} height={150} />
            <div className='grid grid-cols-1 md:grid-cols-3 mt-5'>
                <div className='p-4 border-r'>
                    <h2>{businessInfo?.businessName}</h2>
                    <h2 className='font-bold text-3xl'>{eventInfo?.eventName || 'Meeting Name'}</h2>
                    <div className='mt-5 flex flex-col gap-4'>
                        <h2 className='flex gap-2'><Clock />{eventInfo?.duration} Min</h2>
                        <h2 className='flex gap-2'><MapPin />{eventInfo?.locationType} Meeting</h2>
                        <h2 className='flex gap-2'><CalendarCheck />{format(date, 'PPP')}</h2>
                        {selectedTime && <h2 className='flex gap-2'><Timer />{selectedTime}</h2>}
                        <Link href={eventInfo?.locationUrl || '#'} className='text-primary'>
                            {eventInfo?.locationUrl}
                        </Link>
                    </div>
                </div>
                {step === 1 ?
                    <TimeDateSelection
                        date={date}
                        enableTimeSlot={enableTimeSlot}
                        handleDateChange={handleDateChange}
                        setSelectedTime={setSelectedTime}
                        timeSlots={availableTimeSlots}
                        selectedTime={selectedTime}
                        prevBooking={prevBooking}
                    /> :
                    <UserFormInfo
                        setUserName={setUserName}
                        setUserEmail={setUserEmail}
                        setUserNote={setUserNote}
                    />}
            </div>
            <div className='flex gap-3 justify-end'>
                {step === 2 && <Button variant="outline" onClick={() => setStep(1)}>Back</Button>}
                {step === 1 ?
                    <Button className="mt-10 float-right"
                        disabled={!selectedTime || !date}
                        onClick={() => setStep(step + 1)}>
                        Next
                    </Button> :
                    <Button disabled={!userEmail || !userName} onClick={handleScheduleEvent}>
                        {loading ? <LoaderIcon className='animate-spin' /> : 'Schedule'}
                    </Button>}
            </div>
        </div>
    );
}

export default MeetingTimeDateSelection;
