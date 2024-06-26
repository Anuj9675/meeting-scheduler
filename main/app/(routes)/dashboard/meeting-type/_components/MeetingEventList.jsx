"use client"

import { app } from '@/config/FirebaseConfig'
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import { getFirestore, collection, query, where, getDocs, orderBy, deleteDoc, doc, getDoc } from 'firebase/firestore'
import { Clock, Calendar, MapPin, Pen, Settings, Trash } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function MeetingEventList() {
    const db = getFirestore(app);
    const { user } = useKindeBrowserClient();
    const [businessInfo, setBusinessInfo] = useState();
    const [eventList, setEventList] = useState([]);

    useEffect(() => {
        user && getEventList();
        user && BusinessInfo();
    }, [user]);

    const getEventList = async () => {
        setEventList([]);
        const q = query(collection(db, "MeetingEvent"),
            where("createdBy", "==", user?.email),
            orderBy('id', 'desc'));

        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            console.log(doc.id, " => ", doc.data());
            setEventList(prevEvent => [...prevEvent, doc.data()])
        });
    }

    const BusinessInfo = async () => {
        const docRef = doc(db, 'Business', user.email);
        const docSnap = await getDoc(docRef);
        setBusinessInfo(docSnap.data());
    }

    const onDeleteMeetingEvent = async (event) => {
        await deleteDoc(doc(db, "MeetingEvent", event?.id)).then(resp => {
            toast('Meeting Event Deleted!');
            getEventList();
        })
    }

    const onOpenClickHandler = (event) => {
        const meetingEventUrl = process.env.NEXT_PUBLIC_BASE_URL + '/' + businessInfo.businessName + '/' + event.id
        window.open(meetingEventUrl, '_blank');
    }

    return (
        <div className='mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7'>
            {eventList.length > 0 ? eventList?.map((event, index) => (
                <div key={index} className='border shadow-md border-t-8 rounded-lg p-5 flex flex-col gap-3' style={{ borderTopColor: event?.themeColor }}>
                    <div className='flex justify-end'>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Settings className='cursor-pointer' />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem className="flex gap-2"> <Pen /> Edit</DropdownMenuItem>
                                <DropdownMenuItem className="flex gap-2" onClick={() => onDeleteMeetingEvent(event)}> <Trash /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <h2 className="font-medium text-xl">
                        {event?.eventName}</h2>
                    <div className='flex justify-between'>
                        <h2 className='flex gap-2 text-gray-500'><Clock /> {event.duration} Min </h2>
                        <h2 className='flex gap-2 text-gray-500'><MapPin /> {event.locationType} Min </h2>
                    </div>
                    <hr />
                    <div className='flex justify-between'>
                        <button className='flex gap-2 text-sm text-primary items-center cursor-pointer' onClick={() => { onOpenClickHandler(event) }}>
                            <Calendar className='h-4 w-4' /> Open Link
                        </button>
                    </div>
                </div>
            )) : (
                <div className="flex justify-center items-center h-screen">
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-500"></div>
                </div>
            )}
        </div>
    )
}

export default MeetingEventList
