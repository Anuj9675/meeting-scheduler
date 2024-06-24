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
  const router = useRouter();
  const db = getFirestore(app);
  const [loading, setLoading] = useState(false);
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
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!regex.test(userEmail)) {
      toast('Enter valid email address');
      return;
    }
    const docId = Date.now().toString();
    setLoading(true);
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
    }).then(resp => {
      toast('Meeting Scheduled successfully!');
      sendEmail(userName);
    }).catch(error => {
      toast('Failed to schedule meeting');
      setLoading(false);
    });
  };

  const sendEmail = (user) => {
    const emailHtml = render(<Email
      businessName={businessInfo?.businessName}
      date={format(date, 'PPP').toString()}
      duration={eventInfo?.duration}
      meetingTime={selectedTime}
      meetingUrl={eventInfo.locationUrl}
      userFirstName={user}
    />);

    plunk.emails.send({
      to: userEmail,
      subject: "Meeting Schedule Details",
      body: emailHtml,
    }).then(resp => {
      setLoading(false);
      router.replace('/confirmation');
    }).catch(error => {
      toast('Failed to send email');
      setLoading(false);
    });
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
    if (step === 1) {
      setStep(2);
    } else {
      handleScheduleEvent();
    }
  };

  return (
    <div className='p-5 py-10 shadow-lg m-5 border-t-8 mx-10 md:mx-26 lg:mx-56 my-10' style={{ borderTopColor: eventInfo?.themeColor }}>
      <Image src='/Logo.png' alt='logo' width={150} height={150} />
      <div className='grid grid-cols-1 md:grid-cols-3 mt-5'>
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
          <Button onClick={handleSubmit} loading={loading} disabled={!enableTimeSlot && step === 1}>
             Schedule Meeting
          </Button>
        </div>
      </div>
    </div>
  );
}

export default MeetingTimeDateSelection;
