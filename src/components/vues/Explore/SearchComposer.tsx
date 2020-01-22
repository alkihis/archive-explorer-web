import React from 'react';
import LANG from '../../../classes/Lang/Language';
import classes from './Explore.module.scss';
import { Dialog, DialogContent, DialogTitle, DialogContentText, IconButton, TextField, DialogActions, Button, Select, FormControl, MenuItem, Hidden } from '@material-ui/core';
import DateFnsUtils from '@date-io/date-fns';
import { fr, enUS } from "date-fns/locale";
import {
  MuiPickersUtilsProvider,
  DatePicker,
} from '@material-ui/pickers';
import DeleteIcon from '@material-ui/icons/Delete';
import AddButton from '@material-ui/icons/Add';
import SETTINGS from '../../../tools/Settings';


/// -------------
/*
* Search composer
*/
/// -------------

interface AdvancedInputProperties {
  keyword: string;
  operators?: (":" | ">=" | ">" | "<=" | "<")[];
  type: "date" | "string" | "number" | "month" | "day" | "signednumber";
  /** Functions are needed because text change when LANG changes */
  text: () => string;
}

const SEARCH_KEYWORDS: AdvancedInputProperties[] = [{
  keyword: 'since',
  type: "date",
  text: () => LANG.since,
}, {
  keyword: 'until',
  type: "date",
  text: () => LANG.until,
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
}];


function ComposeSearchModal(props: {
  onSearchMake?: (search: string) => void,
  onClose?: () => void,
}) {
  const [search, setSearch] = React.useState("");
  const [inputs, setInputs] = React.useState([] as (AdvancedInputProperties & { id: number, value: string, operator: string })[]);
  const [freeText, setFreeText] = React.useState("");

  function deleteInput(id: number) {
    setInputs(inputs.filter(i => i.id !== id));
  }

  function addInput(keyword: string) {
    const input = SEARCH_KEYWORDS.find(e => e.keyword === keyword);
    if (input) {
      setInputs([
        ...inputs,
        { ...input, id: Math.random(), value: "", operator: ":" }
      ]);
    }
  }

  function updateInput(id: number, value: string, operator: string) {
    const input = inputs.findIndex(e => e.id === id);
    if (input !== -1) {
      inputs[input].value = value;
      inputs[input].operator = operator;
      refreshSearchString();
    }
  }

  function refreshSearchString() {
    setSearch((inputs.map(v => v.keyword + v.operator + v.value).join(' ') + freeText).trim());
  }

  return (
    <Dialog open onClose={props.onClose} scroll="body">
      <DialogContent>
        <DialogTitle>
          {LANG.advanced_search}
        </DialogTitle>

        <DialogContentText>
          {LANG.advanced_search_explaination}
        </DialogContentText>

        {inputs.map(e => <AdvancedSearchInput 
          key={e.id} 
          data={e} 
          onDelete={() => deleteInput(e.id)}
          onChange={(v, op) => updateInput(e.id, v, op)}
        />)}

        <div>
          {/*  TODO  */}
          <IconButton>
            <AddButton />
          </IconButton>
        </div>

        <TextField
          label={LANG.free_text}
          type="text"
          value={freeText}
          onChange={e => setFreeText(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose} color="primary">
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
      return LANG.starting_to;
    case "<=":
      return LANG.until;
    case "<":
      return LANG.lower_than;
    case ":":
      return LANG.equal_to;
  }

  return LANG.invalid_operator;
}

function AdvancedSearchInput(props: {
  onChange?: (value: string, operator: string) => void,
  onDelete?: () => void,
  data: AdvancedInputProperties
}) {
  const [operator, setOperator] = React.useState(props.data.operators ? props.data.operators[0] : ":");
  const [input, setInput] = React.useState('');
  const [dateInput, setDateInput] = React.useState(new Date());
  const [isError, setIsError] = React.useState(false);

  function changeInput(value: string) {
    setInput(value);
    if (props.onChange) {
      props.onChange(value.trim(), operator);
    }
  }

  function getRightInput() {
    if (props.data.type === "string") {
      return (
        <TextField
          error={isError}
          label={LANG.value}
          type="text"
          value={input}
          onChange={e => {
            const val = e.target.value;
            if (val.split(/\s/).length === 1) {
              changeInput(e.target.value)
              setIsError(false);
            }
            else {
              setIsError(true);
            }
          }}
          helperText={isError ? LANG.invalid_value : ""}
        />
      );
    }
    else if (props.data.type === "number") {
      return (
        <TextField
          error={isError}
          label={LANG.value}
          type="number"
          value={input}
          onChange={e => {
            const val = e.target.value;
            if (Number(val) >= 0) {
              changeInput(e.target.value)
              setIsError(false);
            }
            else {
              setIsError(true);
            }
          }}
          helperText={isError ? LANG.invalid_value : ""}
        />
      );
    }
    else if (props.data.type === "signednumber") {
      return (
        <TextField
          error={isError}
          label={LANG.value}
          type="number"
          value={input}
          onChange={e => {
            const val = e.target.value;
            if (!isNaN(Number(val))) {
              changeInput(val)
              setIsError(false);
            }
            else {
              setIsError(true);
            }
          }}
          helperText={isError ? LANG.invalid_value : ""}
        />
      );
    }
    else if (props.data.type === "day") {
      return (
        <TextField
          error={isError}
          label={LANG.value}
          type="number"
          value={input}
          onChange={e => {
            const val = e.target.value;
            if (Number(val) > 0 && Number(val) <= 31) {
              changeInput(val)
              setIsError(false);
            }
            else {
              setIsError(true);
            }
          }}
          helperText={isError ? LANG.invalid_value : ""}
        />
      );
    }
    else if (props.data.type === "month") {
      return (
        <TextField
          error={isError}
          label={LANG.value}
          type="number"
          value={input}
          onChange={e => {
            const val = e.target.value;
            if (Number(val) > 0 && Number(val) <= 12) {
              changeInput(val)
              setIsError(false);
            }
            else {
              setIsError(true);
            }
          }}
          helperText={isError ? LANG.invalid_value : ""}
        />
      );
    }
    else if (props.data.type === "date") {
      return (
        <MuiPickersUtilsProvider utils={DateFnsUtils} locale={SETTINGS.lang === "fr" ? fr : enUS}>
          <DatePicker
            margin="normal"
            label="Début de l'emploi"
            format="yyyy-MM-DD"
            maxDate={new Date()}
            value={dateInput}
            onChange={e => {
              const year = e.getFullYear();
              const month = String(e.getMonth() + 1).padStart(2);
              const day = String(e.getDate()).padStart(2);

              changeInput(`${year}-${month}-${day}`);
              setDateInput(e);
            }}
            okLabel={LANG.confirm}
            cancelLabel={LANG.close}
          />
        </MuiPickersUtilsProvider>
      );
    }
  }

  const handleOperatorChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setOperator(event.target.value as any);
    if (props.onChange) {
      props.onChange(input, event.target.value as any);
    }
  };

  return (
    <div className={classes.advanced_search_choices_grid}>
      <div>
        {props.data.text()}

        <Hidden lgUp>
          <IconButton onClick={props.onDelete}>
            <DeleteIcon />
          </IconButton>
        </Hidden>
      </div>

      {/* Operators */}
      {props.data.operators && props.data.operators.length > 0 ? <FormControl className={classes.form_control}>
        <Select
          value={operator}
          onChange={handleOperatorChange}
        >
          {props.data.operators.map((op, i) => <MenuItem value={op} key={i}>
            {operatorToText(op)}
          </MenuItem>)}
        </Select>
      </FormControl> : <div />}

      {/* Value form control */}
      <div className={classes.form_control}>
        {getRightInput()}
      </div>

      <Hidden mdDown>
        <IconButton onClick={props.onDelete}>
          <DeleteIcon />
        </IconButton>
      </Hidden>
    </div>
  );
}
