import React from 'react';
import LANG from '../../../classes/Lang/Language';
import classes from './Explore.module.scss';
import { Dialog, DialogContent, DialogTitle, DialogContentText, IconButton, TextField, DialogActions, Button, Select, FormControl, MenuItem, InputLabel, Divider, FormControlLabel, Checkbox, Hidden, Fab } from '@material-ui/core';
import DateFnsUtils from '@date-io/date-fns';
import { fr, enUS } from "date-fns/locale";
import {
  MuiPickersUtilsProvider,
  DatePicker,
} from '@material-ui/pickers';
import DeleteIcon from '@material-ui/icons/Delete';
import AddButton from '@material-ui/icons/Add';
import SETTINGS from '../../../tools/Settings';
import { dateFormatter, uppercaseFirst, getMonthText, range } from '../../../helpers';
import CustomTooltip from '../../shared/CustomTooltip/CustomTooltip';
import { Marger } from '../../../tools/PlacingComponents';
import { iter } from 'iterator-helper';


/// -------------
/*
* Search composer
*/
/// -------------

interface AdvancedInputProperties {
  keyword: string;
  operators?: (":" | ">=" | ">" | "<=" | "<")[];
  type: "date" | "string" | "number" | "month" | "day" | "bigint" | "signednumber" | "choices";
  /** Functions are needed because text change when LANG changes */
  text: () => string;
  choices?: () => [string, string][];
  _choices?: [string, string][];
}

const SEARCH_KEYWORDS: AdvancedInputProperties[] = [{
  keyword: 'since',
  type: "date",
  text: () => LANG.since_date,
}, {
  keyword: 'until',
  type: "date",
  text: () => LANG.until_date,
}, {
  keyword: 'year',
  type: 'number',
  operators: [":", ">=", ">", "<=", "<"],
  text: () => LANG.year,
}, {
  keyword: 'month',
  type: 'month',
  operators: [":", ">=", ">", "<=", "<"],
  text: () => LANG.month,
}, {
  keyword: 'day',
  type: 'day',
  operators: [":", ">=", ">", "<=", "<"],
  text: () => LANG.day,
}, {
  keyword: 'retweets',
  type: 'number',
  operators: [":", ">=", ">", "<=", "<"],
  text: () => LANG.retweet_count,
}, {
  keyword: 'favorites',
  type: 'number',
  operators: [":", ">=", ">", "<=", "<"],
  text: () => LANG.favorite_count,
}, {
  keyword: 'popularity',
  type: 'number',
  operators: [":", ">=", ">", "<=", "<"],
  text: () => LANG.popularity,
}, {
  keyword: 'medias',
  type: 'number',
  operators: [":", ">=", ">", "<=", "<"],
  text: () => LANG.media_count,
}, {
  keyword: 'mentions',
  type: 'number',
  operators: [":", ">=", ">", "<=", "<"],
  text: () => LANG.mentions_count,
}, {
  keyword: 'id',
  type: 'bigint',
  operators: [":", ">=", ">", "<=", "<"],
  text: () => LANG.tweet_identifier,
}, {
  keyword: 'user_id',
  type: 'bigint',
  operators: [":", ">=", ">", "<=", "<"],
  text: () => LANG.user_identifier,
}, {
  keyword: 'has',
  type: 'choices',
  text: () => LANG.has_search_choices,
  choices: () => [
    ['image', LANG.image],
    ['video', LANG.video],
    ['gif', LANG.gif],
    ['link', LANG.link],
    ['hashtag', LANG.hashtag],
  ],
}, {
  keyword: 'is',
  type: 'choices',
  text: () => LANG.is_search_choices,
  choices: () => [
    ['retweet', LANG.retweet],
    ['quote', LANG.quote],
    ['reply', LANG.reply],
    ['noreply', LANG.not_a_reply],
  ],
}, {
  keyword: 'src_contains',
  type: 'string',
  text: () => LANG.src_contains,
}, {
  keyword: 'lang',
  type: 'choices',
  text: () => LANG.lang,
  choices: () => {
    const langs = new Set<string>();

    for (const tweet of SETTINGS.archive.tweets) {
      if ('lang' in tweet)
        langs.add((tweet as any).lang);
    }

    return iter(langs)
      .map(lang => [lang, lang] as [string, string])
      .toArray();
  },
}];

/**
 * Returns `value` or `"value"` if `value` contains whitespace characters.
 */
function valueOrQuotedValue(value: string) {
  if (value.match(/\s/)) {
    return `"${value}"`;
  }
  return value;
}

/**
 * Modal used to create an advanced search
 */
export default function ComposeSearchModal(props: {
  onSearchMake?: (search: string) => void,
  onClose?: () => void,
  canSetCurrent?: boolean,
}) {
  const [search, setSearch] = React.useState("");
  const [inputs, setInputs] = React.useState([] as { id: number, value: string, operator: string, input: AdvancedInputProperties }[]);
  const [freeText, setFreeText] = React.useState("");
  const [currentMonth, setCurrentMonth] = React.useState(false);

  React.useEffect(() => {
    // Delete possible cache on component init
    for (const keyword of SEARCH_KEYWORDS) {
      if (keyword._choices) {
        keyword._choices = undefined;
      }
    }
  }, []);

  function deleteInput(id: number) {
    setInputs(inputs.filter(i => i.id !== id));
  }

  function addInput() {
    const input = SEARCH_KEYWORDS[0];
    if (input) {
      setInputs([
        ...inputs,
        { id: Math.random(), value: "", operator: ":", input }
      ]);
    }
  }

  function updateInput(id: number, keyword: string, value: string, operator: string) {
    const input = inputs.findIndex(e => e.id === id);
    if (input !== -1) {
      inputs[input].value = value;
      inputs[input].operator = operator;
      inputs[input].input = SEARCH_KEYWORDS.find(e => e.keyword === keyword);
      getSearchString();
    }
  }

  function refreshSearchString() {
    return (currentMonth ? ":current " : "") +
      (inputs.map(v => v.input.keyword + v.operator + valueOrQuotedValue(v.value)).join(' ') + " " + freeText).trim();
  }

  function getSearchString() {
    const s = refreshSearchString();
    if (s !== search) {
      setSearch(s);
    }
    return s;
  }

  const search_string = getSearchString();

  return (
    <Dialog open onClose={props.onClose} scroll="body" fullWidth maxWidth="md">
      <DialogTitle>
        {LANG.advanced_search}
      </DialogTitle>
      <DialogContent>
        {/* Presentation of advanced search */}
        <DialogContentText>
          {LANG.advanced_search_explaination}
        </DialogContentText>

        <Marger size={8} />

        {/* Free search text */}
        <div className={classes.free_text_field}>
          <TextField
            label={LANG.free_text}
            fullWidth
            variant="outlined"
            value={freeText}
            onChange={e => { setFreeText(e.target.value); }}
          />
        </div>

        {/* Criterias input */}
        {inputs.map(e => <AdvancedSearchInput
          key={e.id}
          id={e.id}
          onDelete={() => deleteInput(e.id)}
          onChange={(kw, v, op) => updateInput(e.id, kw, v, op)}
        />)}

        {/* Add a criteria button */}
        <div className={classes.add_criteria_btn_container}>
          <CustomTooltip title={LANG.add_a_criteria}>
            <Fab size="medium" color="primary" onClick={addInput} style={{ margin: '1rem 0' }}>
              <AddButton />
            </Fab>
          </CustomTooltip>
        </div>

        <Hidden xsUp={!props.canSetCurrent}>
          <Marger size={4} />

          <FormControlLabel
            value="ok"
            control={
              <Checkbox
                color="primary"
                checked={currentMonth}
                onChange={(_, c) => setCurrentMonth(c)}
              />
            }
            label={LANG.search_in_current_month}
            labelPlacement="end"
          />
        </Hidden>

        <Marger size={4} />
        <Divider />
        <Marger size={6} />

        {/* Content of search */}
        <DialogContentText>
          {LANG.adv_search_result}
        </DialogContentText>
        <div className={classes.search_string_preview}>
          {search_string || LANG.empty_adv_search}
        </div>
      </DialogContent>
      <DialogActions>
        <Button disabled={!search_string} onClick={() => props.onSearchMake && props.onSearchMake(search)} color="primary">
          {LANG.make_search}
        </Button>

        <Button onClick={props.onClose} color="secondary">
          {LANG.close}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function operatorToText(op: string) {
  switch (op) {
    case ">":
      return LANG.higher_than;
    case ">=":
      return LANG.starting_at;
    case "<=":
      return LANG.until_operator;
    case "<":
      return LANG.lower_than;
    case ":":
      return LANG.equal_to;
  }

  return LANG.invalid_operator;
}

/**
 * Single criteria for advanced search
 */
function AdvancedSearchInput(props: {
  onChange?: (keyword: string, value: string, operator: string) => void,
  onDelete?: () => void,
  id: number,
}) {
  const [data, setData] = React.useState(SEARCH_KEYWORDS[0]);
  const [operator, setOperator] = React.useState(data.operators ? data.operators[0] : ":");
  const [input, setInput] = React.useState(data.type === "date" ? dateFormatter("Y-m-d") : '');
  const [dateInput, setDateInput] = React.useState(new Date());
  const [isError, setIsError] = React.useState(false);

  function changeInput(value: string) {
    setInput(value);
    formatAndTriggerChange(data.keyword, value, operator);
  }

  function formatAndTriggerChange(keyword: string, value: string, operator: string) {
    if (props.onChange) {
      value = value.trim();
      const data = SEARCH_KEYWORDS.find(e => e.keyword === keyword);

      if (data.type === "day" || data.type === "month" || data.type.includes("number")) {
        value = String(Number(value))
      }
      else if (data.type === "bigint") {
        try {
          value = String(BigInt(value));
        } catch (e) { }
      }

      props.onChange(data.keyword, value, operator);
    }
  }

  function getRightInput() {
    if (data.type === "string") {
      return (
        <TextField
          error={isError}
          label={LANG.value}
          type="text"
          value={input}
          onChange={e => {
            if (isError) {
              setIsError(false);
            }
            changeInput(e.target.value)
          }}
          helperText=""
        />
      );
    }
    else if (data.type === "number") {
      return (
        <TextField
          error={isError}
          label={LANG.value}
          type="number"
          value={input}
          onChange={e => {
            const val = e.target.value;
            if (Number(val) >= 0) {
              setIsError(false);
            }
            else {
              setIsError(true);
            }
            changeInput(e.target.value)
          }}
          helperText={isError ? LANG.invalid_value : ""}
        />
      );
    }
    else if (data.type === "bigint") {
      return (
        <TextField
          error={isError}
          label={LANG.value}
          value={input}
          onChange={e => {
            const val = e.target.value;
            let number_value: number | bigint;

            try {
              number_value = BigInt(val);
            } catch (e) {
              number_value = Number(val);
            }

            if (number_value >= 0) {
              setIsError(false);
            }
            else {
              setIsError(true);
            }
            changeInput(e.target.value)
          }}
          helperText={isError ? LANG.invalid_value : ""}
        />
      );
    }
    else if (data.type === "signednumber") {
      return (
        <TextField
          error={isError}
          label={LANG.value}
          type="number"
          value={input}
          onChange={e => {
            const val = e.target.value;
            if (!isNaN(Number(val))) {
              setIsError(false);
            }
            else {
              setIsError(true);
            }
            changeInput(val)
          }}
          helperText={isError ? LANG.invalid_value : ""}
        />
      );
    }
    else if (data.type === "day") {
      return (
        <>
          <InputLabel id={String(props.id) + "day-select"}>{uppercaseFirst(LANG.day)}</InputLabel>
          <Select
            labelId={String(props.id) + "day-select"}
            value={input}
            onChange={e => {
              const val = String(e.target.value as any || "");
              setIsError(false);
              changeInput(val || "")
            }}
          >
            {range(1, 32).map(day => <MenuItem value={day} key={day}>
              {day}
            </MenuItem>)}
          </Select>
        </>
      );
    }
    else if (data.type === "month") {
      return (
        <>
          <InputLabel id={String(props.id) + "month-select"}>{uppercaseFirst(LANG.month)}</InputLabel>
          <Select
            labelId={String(props.id) + "month-select"}
            value={input}
            onChange={e => {
              const val = String(e.target.value as any || "");
              setIsError(false);
              changeInput(val || "")
            }}
          >
            {range(1, 13).map(month => <MenuItem value={month} key={month}>
              {uppercaseFirst(getMonthText(String(month)))}
            </MenuItem>)}
          </Select>
        </>
      );
    }
    else if (data.type === "date") {
      return (
        <MuiPickersUtilsProvider utils={DateFnsUtils} locale={SETTINGS.lang === "fr" ? fr : enUS}>
          <DatePicker
            margin="none"
            label={LANG.value}
            format={SETTINGS.lang === "fr" ? "dd/MM/yyyy" : "yyyy-MM-dd"}
            maxDate={new Date()}
            value={dateInput}
            onChange={e => {
              changeInput(dateFormatter('Y-m-d', e));;
              setDateInput(e);
            }}
            okLabel={LANG.confirm}
            cancelLabel={LANG.close}
          />
        </MuiPickersUtilsProvider>
      );
    }
    else if (data.type === "choices") {
      const choices = data._choices ? data._choices : data.choices();
      data._choices = choices;

      return (
        <>
          <InputLabel id={String(props.id) + "choices-select"}>{uppercaseFirst(LANG.value)}</InputLabel>
          <Select
            labelId={String(props.id) + "choices-select"}
            value={input}
            onChange={e => {
              const val = String(e.target.value as any || "");
              setIsError(false);
              changeInput(val || "")
            }}
          >
            {choices.map(choice => <MenuItem value={choice[0]} key={choice[0]}>
              {choice[1]}
            </MenuItem>)}
          </Select>
        </>
      );
    }
  }

  const handleOperatorChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setOperator(event.target.value as any);
    formatAndTriggerChange(data.keyword, input, event.target.value as any);
  };

  const handleKeywordChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const kw = event.target.value as any;
    const new_kw = SEARCH_KEYWORDS.find(k => k.keyword === kw);
    const new_input = new_kw.type === "date" ? dateFormatter("Y-m-d") : '';
    setInput(new_input);
    setData(new_kw);
    formatAndTriggerChange(kw, new_input, operator);
  };

  React.useEffect(() => {
    // Init change
    formatAndTriggerChange(data.keyword, input, operator);
    // eslint-disable-next-line
  }, []);

  return (
    <div className={classes.advanced_search_choices_grid}>
      <div>
        <FormControl className={classes.form_control_full}>
          <InputLabel id={String(props.id) + "keyword"}>{LANG.keyword}</InputLabel>
          <Select
            labelId={String(props.id) + "keyword"}
            value={data.keyword}
            onChange={handleKeywordChange}
          >
            {SEARCH_KEYWORDS.map(d => <MenuItem value={d.keyword} key={d.keyword}>
              {uppercaseFirst(d.text())}
            </MenuItem>)}
          </Select>
        </FormControl>
      </div>

      {/* Operators */}
      {data.operators && data.operators.length > 0 ? <FormControl className={classes.form_control}>
        <InputLabel id={String(props.id)}>{LANG.operator}</InputLabel>
        <Select
          value={operator}
          labelId={String(props.id)}
          onChange={handleOperatorChange}
        >
          {data.operators.map((op, i) => <MenuItem value={op} key={i}>
            {operatorToText(op)}
          </MenuItem>)}
        </Select>
      </FormControl> : <div />}

      {/* Value form control */}
      <FormControl className={classes.form_control}>
        {getRightInput()}
      </FormControl>

      <div className={classes.adv_search_delete_btn}>
        <IconButton onClick={props.onDelete}>
          <DeleteIcon />
        </IconButton>
      </div>
    </div>
  );
}
