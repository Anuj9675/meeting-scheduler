'use client';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarCheck, Clock, LoaderIcon, MapPin, Timer } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import TimeDateSelection from './TimeDateSelection';
import UserFormInfo from './UserFormInfo';
import { collection, doc, getDocs, getFirestore, query, setDoc, where } from 'firebase/firestore';
import { app } from '@/config/FirebaseConfig';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Plunk from '@plunk/node';
import { render } from '@react-email/render';
import Email from '@/emails';

function MeetingTimeDateSelection({ eventInfo, businessInfo }) {
  const [date, setDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState([]);
  const [enableTimeSlot, setEnabledTimeSlot] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userNote, setUserNote] = useState('');
  const [prevBooking, setPrevBooking] = useState([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false); // State for thank you message
  const router = useRouter(); // Initialize useRouter
  const db = getFirestore(app);
  const plunk = new Plunk(process.env.NEXT_PUBLIC_PLUNK_API_KEY);

  useEffect(() => {
    if (eventInfo?.duration) {
      createTimeSlot(eventInfo.duration);
    }
  }, [eventInfo]);

  const createTimeSlot = (interval) => {
    const startTime = 8 * 60; // 8 AM in minutes
    const endTime = 22 * 60; // 10 PM in minutes
    const totalSlots = (endTime - startTime) / interval;
    const slots = Array.from({ length: totalSlots }, (_, i) => {
      const totalMinutes = startTime + i * interval;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const formattedHours = hours > 12 ? hours - 12 : hours; // Convert to 12-hour format
      const period = hours >= 12 ? 'PM' : 'AM';
      return `${String(formattedHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
    });

    console.log('Time Slots:', slots); // Debugging log
    setTimeSlots(slots);
  };

  const handleDateChange = (date) => {
    setDate(date);
    const day = format(date, 'EEEE');
    if (businessInfo?.daysAvailable?.[day]) {
      getPrevEventBooking(date);
      setEnabledTimeSlot(true);
    } else {
      setEnabledTimeSlot(false);
    }
  };

  const handleScheduleEvent = async () => {
    const docId = Date.now().toString();
    setLoading(true);
    try {
      await setDoc(doc(db, 'ScheduledMeetings', docId), {
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
      });
      toast('Meeting Scheduled successfully!');
      setLoading(false);
      setShowThankYou(true); // Show thank you message
    } catch (error) {
      console.error('Failed to schedule meeting', error);
      toast('Failed to schedule meeting');
      setLoading(false);
    }
  };

  const getPrevEventBooking = async (date_) => {
    const q = query(collection(db, 'ScheduledMeetings'),
      where('selectedDate', '==', date_),
      where('eventId', '==', eventInfo.id));

    const querySnapshot = await getDocs(q);
    const bookings = [];
    querySnapshot.forEach((doc) => {
      bookings.push(doc.data());
    });
    setPrevBooking(bookings);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleScheduleEvent();
  };

  const handleBack = () => {
    setShowThankYou(false); // Hide thank you message
  };

  return (
    <div className='p-5 py-10 shadow-lg m-5 border-t-8 mx-10 md:mx-26 lg:mx-56 my-10' style={{ borderTopColor: eventInfo?.themeColor }}>
      <Image src='/Logo.png' alt='logo' width={150} height={150} />
      <div className='grid grid-cols-1 md:grid-cols-3 mt-5'>
        {showThankYou ? (
          <div className='col-span-3 p-4 text-center'>
            <h2 className='text-3xl font-bold'>Thank you for scheduling!</h2>
            <Button onClick={handleBack} className='mt-4'>
              Back
            </Button>
          </div>
        ) : (
          <>
            <div className='p-4 border-r'>
              <h2>{businessInfo?.businessName}</h2>
              <h2 className='font-bold text-3xl'>{eventInfo?.eventName ? eventInfo?.eventName : 'Meeting Name'}</h2>
              <div className='mt-5 flex flex-col gap-4'>
                <h2 className='flex gap-2'><Clock />{eventInfo?.duration} Min</h2>
                <h2 className='flex gap-2'><MapPin />{eventInfo?.locationType} Meeting</h2>
                <h2 className='flex gap-2'><CalendarCheck />{format(date, 'PPP')}</h2>
                {selectedTime && <h2 className='flex gap-2'><Timer />{selectedTime}</h2>}
                <Link href={eventInfo?.locationUrl ? eventInfo?.locationUrl : '#'} className='text-primary'>
                  {eventInfo?.locationUrl}
                </Link>
              </div>
            </div>
            
            <TimeDateSelection
              date={date}
              enableTimeSlot={enableTimeSlot}
              handleDateChange={handleDateChange}
              setSelectedTime={setSelectedTime}
              timeSlots={timeSlots}
              selectedTime={selectedTime}
              prevBooking={prevBooking}
            />

            <div className='col-span-3 p-4 mt-5 flex justify-end'>
              <Button onClick={handleSubmit} loading={loading} disabled={!enableTimeSlot}>
                 Schedule Meeting
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MeetingTimeDateSelection;
