import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isSunday,
  isSaturday,
} from 'date-fns';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const calendarData = {
  '2025-08-29': { type: 'no-activity', color: '#ff4c4c' }, // Red
  '2025-08-30': { type: 'high-activity', color: '#4CAF50' }, // Green
  '2025-08-31': { type: 'no-activity', color: '#ff4c4c' }, // Red
  '2025-09-13': { type: 'no-activity', color: '#ff4c4c' }, // Red
  '2025-09-24': { type: 'today', color: '#4092ff' }, // Blue
};

const studyData = [
  { date: 'Aug 25', hours: 0 },
  { date: 'Aug 26', hours: 0 },
  { date: 'Aug 27', hours: 0.5 },
  { date: 'Aug 28', hours: 0 },
  { date: 'Aug 29', hours: 0.5 },
  { date: 'Aug 30', hours: 10 },
  { date: 'Aug 31', hours: 0 },
  { date: 'Sep 1', hours: 0 },
  { date: 'Sep 2', hours: 0 },
  { date: 'Sep 3', hours: 0 },
  { date: 'Sep 4', hours: 0 },
  { date: 'Sep 5', hours: 0 },
  { date: 'Sep 6', hours: 0 },
  { date: 'Sep 7', hours: 0 },
  { date: 'Sep 8', hours: 0 },
  { date: 'Sep 9', hours: 0 },
  { date: 'Sep 10', hours: 0 },
  { date: 'Sep 11', hours: 0 },
  { date: 'Sep 12', hours: 0 },
  { date: 'Sep 13', hours: 0 },
  { date: 'Sep 14', hours: 0 },
  { date: 'Sep 15', hours: 0 },
  { date: 'Sep 16', hours: 0 },
  { date: 'Sep 17', hours: 0 },
  { date: 'Sep 18', hours: 0 },
  { date: 'Sep 19', hours: 0 },
  { date: 'Sep 20', hours: 0 },
  { date: 'Sep 21', hours: 0 },
  { date: 'Sep 22', hours: 0 },
  { date: 'Sep 23', hours: 0 },
];

const AppDashboard = () => {
  const currentMonth = new Date();
  const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);

  const getCalendarDays = (date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(new Date(date.getFullYear(), date.getMonth() + 1, 0), {
      weekStartsOn: 1,
    });
    return eachDayOfInterval({ start, end });
  };

  const augustDays = getCalendarDays(new Date('2025-08-01'));
  const septemberDays = getCalendarDays(new Date('2025-09-01'));

  const calendarHeader = (
    <div className='grid grid-cols-7 gap-1 text-center font-bold text-gray-400'>
      {daysOfWeek.map((day) => (
        <span key={day}>{day}</span>
      ))}
    </div>
  );

  const renderCalendar = (days, monthName) => (
    <div className='mb-8'>
      <h2 className='text-lg font-semibold mb-4 text-white'>{monthName} 2025</h2>
      {calendarHeader}
      <div className='grid grid-cols-7 gap-1 text-center'>
        {days.map((day, index) => {
          const dayString = format(day, 'yyyy-MM-dd');
          const isCurrentMonth = format(day, 'M') === format(new Date(monthName + ' 1, 2025'), 'M');
          const dayInfo = calendarData[dayString];
          const today = format(new Date(), 'yyyy-MM-dd');
          let bgColor = 'bg-gray-700';
          let ringColor = 'ring-transparent';

          if (dayInfo) {
            bgColor = dayInfo.color;
          }

          if (isSameDay(day, new Date())) {
            ringColor = 'ring-2 ring-blue-500';
            bgColor = 'bg-transparent';
          }

          return (
            <div
              key={index}
              className={`p-2 rounded-lg aspect-square flex items-center justify-center text-sm font-medium ${
                isCurrentMonth ? 'text-white' : 'text-gray-500'
              } ${bgColor} ${ringColor}`}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className='bg-[#111827] min-h-screen text-white p-6 md:p-10 font-sans'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8'>
        {/* Left Side: Daily Progress Record */}
        <div className='bg-[#1F2937] p-6 rounded-xl shadow-lg'>
          <div className='flex justify-between items-center mb-6'>
            <h1 className='text-2xl font-bold text-[#4B73FF]'>Daily Progress Record</h1>
            <div className='flex items-center text-gray-400'>
              <span className='mr-2'>0 Streak</span>
              <span className='text-yellow-400'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-5 w-5'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 2a8 8 0 100 16 8 8 0 000-16zM5 8a5 5 0 0110 0v1.5a.5.5 0 01-1 0V8a4 4 0 10-8 0v1.5a.5.5 0 01-1 0V8z'
                    clipRule='evenodd'
                  />
                </svg>
              </span>
            </div>
          </div>
          <h2 className='text-lg font-semibold mb-4 text-gray-300'>
            Daily Study Hours Graph (Last 30 Days)
          </h2>
          <div className='h-64'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                data={studyData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                barSize={10}
              >
                <XAxis
                  dataKey='date'
                  stroke='#4B5563'
                  axisLine={false}
                  tickLine={false}
                  fontSize={12}
                />
                <YAxis stroke='#4B5563' axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                  contentStyle={{
                    backgroundColor: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey='hours'>
                  {studyData.map((entry, index) => (
                    <Bar
                      key={`bar-${index}`}
                      fill={entry.hours > 0 ? '#4CAF50' : '#ff4c4c'}
                      dataKey='hours'
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Side: Calendar */}
        <div className='bg-[#1F2937] p-6 rounded-xl shadow-lg flex flex-col justify-center'>
          {renderCalendar(augustDays, 'August')}
          {renderCalendar(septemberDays, 'September')}
        </div>
      </div>
    </div>
  );
};

export default AppDashboard;