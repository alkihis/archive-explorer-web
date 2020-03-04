import React from 'react';
import { useTheme, Typography, DialogContentText } from '@material-ui/core';
import { ResponsiveContainer, LineChart, XAxis, YAxis, Line, Tooltip } from 'recharts';
import SETTINGS from '../../../tools/Settings';
import { daysInMonth, getMonthText } from '../../../helpers';
import LANG from '../../../classes/Lang/Language';
import { TwitterHelpers } from 'twitter-archive-reader';

type TweetNumberProps = {
  dayView?: { month: string, year: string };
  trimAt?: number;
};

function getTweetCountByDay(month: string, year: string) {
  const tweets = SETTINGS.archive.tweets.month(month, year);

  const day_count: { [day: string]: number } = {};
  const selected_length = daysInMonth(Number(month), Number(year));

  for (const tweet of tweets) {
    const date = TwitterHelpers.dateFromTweet(tweet).getDate();
    if (date in day_count) {
      day_count[date]++;
    }
    else {
      day_count[date] = 1;
    }
  }

  for (let i = 1; i <= selected_length; i++) {
    if (!(i in day_count)) {
      day_count[i] = 0;
    }
  }

  return day_count;
}

function getTweetCountByMonth() {
  const index = SETTINGS.archive.tweets.index;

  const year_month: { [month: string]: number } = {};
  for (const year in index) {
    const months = index[year];

    for (let i = 1; i <= 12; i++) {
      if (i in months) {
        year_month[year + "-" + String(i)] = Object.keys(months[i]).length;
      }
      else {
        year_month[year + "-" + String(i)] = 0;
      }
    }
  }

  return year_month;
}

function convertToData(data: { [dayOrMonth: string]: number }, trim: false | number = 0) {
  let has_found = false;

  if (trim === false) {
    return Object.entries(data).map(([time, amount]) => ({ time, amount }));
  }

  const trimmed_beginning = Object.entries(data)
    .map(([time, amount]) => ({ time, amount }))
    .filter(({ amount }) => { // Trim entries at 0 at the beginning
      if (has_found) {
        return true;
      }
      if (amount > trim) {
        has_found = true;
        return true;
      }
      return false;
    });

  has_found = false;

  return trimmed_beginning
    .reverse()
    .filter(({ amount }) => { // Trim entries at 0 at the end
      if (has_found) {
        return true;
      }
      if (amount > trim) {
        has_found = true;
        return true;
      }
      return false;
    })
    .reverse();
}

const CustomTooltip: React.FC<{
  active: boolean, 
  payload: [any],
  label: string, 
  month?: string, 
  monthPos: "left" | "right"
}> = ({ active, payload, month, monthPos }) => {
  if (active) {
    const has_s = payload[0].payload.amount > 1;

    const on_year = month === undefined;
    let formatted = payload[0].payload.time;
    if (on_year) {
      const [year, month] = formatted.split('-', 2);
      formatted = getMonthText(month) + " " + year;
    }

    return (
      <div>
        <p>
          {month && monthPos === "left" ? month : ""} {formatted} {month && monthPos === "right" ? month.toLocaleLowerCase() : ""}
        </p>
        <p>
          <strong>{payload[0].payload.amount}</strong> tweet{has_s ? "s" : ""}
        </p>
      </div>
    );
  }

  return null;
};

// TODO render tooltip component to give to CustomTooltip

export default function TweetNumberChart(props: TweetNumberProps) {
  const theme = useTheme();
  const idata = props.dayView ? getTweetCountByDay(props.dayView.month, props.dayView.year) : getTweetCountByMonth();
  const data = convertToData(idata, props.dayView ? false : (props.trimAt === undefined ? false : props.trimAt));
  
  const month = props.dayView ? getMonthText(props.dayView.month) : undefined;
  const month_pos = SETTINGS.lang === "fr" ? "right" : "left";

  function formatYearMonth(time: string) {
    if (month) {
      return time;
    }
    if (SETTINGS.lang === "fr") {
      const [year, month] = time.slice(2).split('-', 2);
      return `${month}/${year}`;
    }
    return time.slice(2);
  }

  if (data.length > 0) {
    return (
      <>
        <Typography variant="h6" color="textSecondary" align="center">
          {LANG.posted_tweets_per} {
            props.dayView ? 
            LANG.day_of + " " + month.toLocaleLowerCase() + " " + props.dayView.year : 
            LANG.month
          }
        </Typography>
        <div style={{ height: 400, width: '100%' }}>
          <ResponsiveContainer>
            <LineChart
              data={data}
              margin={{
                top: 16,
                right: 5,
                bottom: 0,
                left: 0,
              }}
            >
              <XAxis 
                dataKey="time" 
                stroke={theme.palette.text.secondary}
                tickFormatter={formatYearMonth} 
              />
              <YAxis stroke={theme.palette.text.secondary} />
  
              <Line type="monotone" dataKey="amount" stroke={theme.palette.primary.main} dot={false} />
              
              <Tooltip content={
                // @ts-ignore
                <CustomTooltip month={month} monthPos={month_pos} />
              } />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </>
    );
  }

  return (
    <div>
      <DialogContentText variant="body1" align="center">
        {LANG.you_dont_have_any_tweet}.
      </DialogContentText>  
    </div>
  )
}
