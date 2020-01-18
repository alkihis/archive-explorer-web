import React from 'react';
import classes from './More.module.scss';
import LANG from '../../../classes/Lang/Language';
import { Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, List, ListItem, ListItemText, useTheme, ListItemAvatar, Avatar, Link, DialogContent, DialogContentText, Dialog, DialogTitle, DialogActions, Button } from '@material-ui/core';
import SETTINGS from '../../../tools/Settings';
import { parseTwitterDate, AdImpression, AdArchive } from 'twitter-archive-reader';
import { dateFormatter, specialJoin, getMonthText } from '../../../helpers';
import { Marger } from '../../../tools/PlacingComponents';
import { ResponsiveContainer, LineChart, XAxis, YAxis, Line, Tooltip } from 'recharts';

export default function AdAndUserData() {
  const has_email = !!SETTINGS.archive.user.email_address;
  const has_age = !!SETTINGS.archive.user.age;
  const has_p13n = !!SETTINGS.archive.user.personalization;
  const has_ads = SETTINGS.archive.ads.impressions.length > 0;

  return (
    <div>
      <Typography variant="h4" className={classes.main_title}>
        {LANG.ads_and_user_data}
      </Typography>

      <ScreenNameHistory />
      
      {has_email && <>
        <Marger size={16} />
        <EmailHistory />
      </>}

      {has_age && <>
        <Marger size={16} />
        <AgeInfo />
      </>}

      {has_p13n && <>
        <Marger size={16} />
        <Personalization />
      </>}

      {has_ads && <>
        <Marger size={16} />
        <TopFiveAdvertisers />
      </>}

      {has_ads && <>
        <Marger size={16} />
        <ImpressionGraph />
      </>}

      <Marger size={16} />
    </div>
  );
}

function ScreenNameHistory() {
  const rows = SETTINGS.archive.user.screen_name_history.map(e => {
    return {
      date: parseTwitterDate(e.changedAt),
      sn: e.changedFrom
    }
  });
  rows.push({
    date: undefined,
    sn: SETTINGS.archive.user.screen_name
  });

  return (
    <div>
      <Typography variant="h5" className={classes.second_title}>
        {LANG.screen_name_history}
      </Typography>

      <Paper className={classes.sn_root}>
        <div className={classes.t_wrapper}>
          <Table stickyHeader className={classes.table}>
            <TableHead>
              <TableRow>
                <TableCell className={classes.th}>{LANG.twitter_at}</TableCell>
                <TableCell className={classes.th} align="right">{LANG.until}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.date ? row.date.toISOString() : '-'}>
                  <TableCell className="bold">@{row.sn}</TableCell>
                  <TableCell style={{minWidth: 120}} align="right" component="th" scope="row">
                    {row.date ? dateFormatter(SETTINGS.lang === "fr" ? "d/m/Y H:i" : "Y-m-d H:i", row.date) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Paper>
    </div>
  );
}

function EmailHistory() {
  const email_history = SETTINGS.archive.user.email_address_history;
  const rows = email_history.map((e, index) => {
    return {
      date: email_history[index+1] ? email_history[index+1].changedAt : undefined,
      sn: e.changedTo
    }
  });

  return (
    <div>
      <Typography variant="h5" className={classes.second_title}>
        {LANG.email_address_history}
      </Typography>

      <Paper className={classes.sn_root}>
        <div className={classes.t_wrapper}>
          <Table stickyHeader className={classes.table}>
            <TableHead>
              <TableRow>
                <TableCell className={classes.th}>{LANG.email_address}</TableCell>
                <TableCell className={classes.th} align="right">{LANG.until}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.date ? row.date.toISOString() : '-'}>
                  <TableCell className="bold">{row.sn}</TableCell>
                  <TableCell style={{minWidth: 120}} align="right" component="th" scope="row">
                    {row.date ? dateFormatter(SETTINGS.lang === "fr" ? "d/m/Y H:i" : "Y-m-d H:i", row.date) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Paper>
    </div>
  );
}

function AgeInfo() {
  const age = SETTINGS.archive.user.age;
  const inferred = age.inferred;

  return (
    <React.Fragment>
      <Typography variant="h5" className={classes.second_title}>
        {LANG.age_by_twitter}
      </Typography>

      {age.age && <Typography>
        {LANG.you_are} <strong>{age.age}</strong> {LANG.years_old}.
        {age.birthDate ? 
          ` ${LANG.you_are_born_on} ${dateFormatter(SETTINGS.lang === "fr" ? "d/m/Y" : "Y-m-d", new Date(age.birthDate))}.` : 
        ""}
      </Typography>}

      {age.inferred && <Typography>
        {LANG.for_twitter}, {LANG.you_are.toLocaleLowerCase()} {
          Array.isArray(inferred.age) ? 
          <>{LANG.between} <strong>{inferred.age[0]} {LANG.and} {inferred.age[1]}</strong></> : 
          <strong>{age.age}</strong>
        } {LANG.years_old}.
      </Typography>}
    </React.Fragment>
  );
}

function Personalization() {
  const [shows, setShows] = React.useState([] as string[]);
  const [names, setNames] = React.useState([] as string[]);

  React.useEffect(() => {
    function randomInt(min: number, max: number) { // min and max included 
      return Math.floor(Math.random() * (max - min + 1) + min);
    }
  
    function getRandomNumbersFrom(max: number, count: number) {
      if (max === 1) {
        return [0];
      }
  
      if (max === 2) {
        return [0, 1];
      }
  
      const numbers = new Set<number>();
      if (max < count) {
        count = max;
      }
  
      let i = 0;
      let max_tries = count + 15;
      while (max_tries && i < count) {
        max_tries--;
        const rand = randomInt(0, max);
        if (numbers.has(rand)) {
          continue;
        }
        numbers.add(rand);
        i++;
      }
  
      return [...numbers];
    }
  
    const interests = SETTINGS.archive.user.personalization.interests;
  
    let shows: string[];
    if (interests.shows.length) {
      shows = getRandomNumbersFrom(interests.shows.length - 1, 5).map(index => interests.shows[index]);
    } 
    let names: string[];
    if (interests.names.length) {
      names = getRandomNumbersFrom(interests.names.length - 1, 5).map(index => interests.names[index]);
    } 
    setShows(shows);
    setNames(names);
  }, []);

  const demograph = SETTINGS.archive.user.personalization.demographics;
  const interests = SETTINGS.archive.user.personalization.interests;

  return (
    <React.Fragment>
      <Typography variant="h5" className={classes.second_title}>
        {LANG.language_spoken}
      </Typography>

      {LANG.on_twitter_you_usually_spoke} "{demograph.languages[0]}" ({LANG.untranslated}).

      <Marger size={8} />

      <Typography variant="h5" className={classes.second_title}>
        {LANG.gender}
      </Typography>

      {LANG.to_twitter_you_are_a} {
        demograph.gender === "male" ? LANG.male : (
          demograph.gender === "female" ? LANG.female : LANG.undefined_gender
        )
      }.

      <Marger size={8} />

      {(!!shows.length || !!names.length) && <Typography variant="h5" className={classes.second_title}>
        {LANG.shows_and_interests}
      </Typography>}

      {!!names.length && <Typography component="div">
        <InterestsModal 
          linkTitle={LANG.things_that_interest_you} 
          things={interests.names}
          title={LANG.things_that_interest_you} 
          explaination={LANG.names_interests_title}
        />: {specialJoin(names)}.
      </Typography>}

      {!!shows.length && <Typography component="div">
        <InterestsModal 
          linkTitle={LANG.shows_that_interest_you} 
          things={interests.shows}
          title={LANG.shows_that_interest_you} 
          explaination={LANG.shows_interests_title}
        />: {specialJoin(shows)}.
      </Typography>}
    </React.Fragment>
  );
}

function TopFiveAdvertisers() {
  const ads = Object.entries(SETTINGS.archive.ads.impressions_by_advertiser).sort((a, b) => b[1].length - a[1].length);
  const top_5 = ads.slice(0, 5).map(e => [e[0].slice(1), e[1]] as [string, AdImpression[]]);

  return (
    <React.Fragment>
      <Typography variant="h5" className={classes.second_title}>
        {LANG.most_seen_advertisers}
      </Typography>

      <List dense>
        {top_5.map((item, index) => <ListItem key={index}>
          <ListItemAvatar>
            <Avatar>
              {item[0].slice(0, 1)}
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary={item[1][0].advertiserInfo.advertiserName} secondary={`${item[1].length} impressions`} />
        </ListItem>)}
      </List>
    </React.Fragment>
  );
}

function ImpressionGraph() {
  const theme = useTheme();
  const impressions_by_date: { [dateString: string]: number } = {};
  const all_impressions = SETTINGS.archive.ads.impressions;

  // Compute impressions
  for (const impression of all_impressions) {
    const date = AdArchive.parseAdDate(impression.impressionTime);
    const trimmed_date = String(date.getFullYear()) + "-" + 
      String(date.getMonth() + 1).padStart(2, "0") + "-" +
      String(date.getDate()).padStart(2, "0");

    if (trimmed_date in impressions_by_date) {
      impressions_by_date[trimmed_date]++;
    }
    else {
      impressions_by_date[trimmed_date] = 1;
    }
  }

  // Sort all dates (ASC)
  const dates = Object.entries(impressions_by_date)
    .map(e => [new Date(e[0]), e[0], e[1]] as [Date, string, number])
    .sort((a, b) => a[0].getTime() - b[0].getTime())
    .map(e => [e[1], e[2]] as [string, number]);

  function formatYearMonth(time: string) {
    if (SETTINGS.lang === "fr") {
      const [year, month, day] = time.slice(2).split('-', 3);
      return `${day}/${month}/${year}`;
    }
    // slice(2) trim the "20" of the date
    return time.slice(2);
  }

  return (
    <React.Fragment>
      <Typography variant="h5" className={classes.second_title}>
        {LANG.impressions_per_date}
      </Typography>

      <Typography gutterBottom>
        {LANG.impression_explaination}
      </Typography>

      <div style={{ height: 400, width: '100%' }}>
        <ResponsiveContainer>
          <LineChart
            data={dates}
            margin={{
              top: 16,
              right: 10,
              bottom: 0,
              left: 0,
            }}
          >
            <XAxis
              dataKey="0" 
              stroke={theme.palette.text.secondary}
              tickFormatter={formatYearMonth} 
              minTickGap={10}
            />
            <YAxis stroke={theme.palette.text.secondary} />

            <Line type="monotone" dataKey="1" stroke={theme.palette.primary.main} dot={false} />
            
            <Tooltip content={
              // @ts-ignore
              <CustomTooltip />
            } />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </React.Fragment>
  );
}

const CustomTooltip: React.FC<{
  active: boolean, 
  payload: [any],
  label: string, 
}> = ({ active, payload }) => {
  if (active) {
    const has_s = payload[0].payload[1] > 1;
    let formatted = payload[0].payload[0];
    const [year, month, day] = formatted.split('-', 3);
    if (SETTINGS.lang === "fr") {
      formatted = day + " " + getMonthText(month).toLocaleLowerCase() + " " + year;
    }
    else {
      formatted = day + " " + getMonthText(month) + " " + year;
    }

    return (
      <div>
        <p>
          {formatted}
        </p>
        <p>
          <strong>{payload[0].payload[1]}</strong> impression{has_s ? "s" : ""}
        </p>
      </div>
    );
  }

  return null;
};

function InterestsModal(props: { things: string[], linkTitle: string, title: string, explaination: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Link href="#!" color="primary" onClick={() => setOpen(true)} title={props.linkTitle}>
        {props.linkTitle}
      </Link>

      <Dialog onClose={() => setOpen(false)} open={open} scroll="body">
        <DialogTitle>{props.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {props.explaination}
          </DialogContentText>

          <List>
            {props.things.map(thing => (
              <ListItem key={thing}>
                <ListItemText primary={thing} />
              </ListItem>
            ))}
          </List>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)} color="primary">
            {LANG.close}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
