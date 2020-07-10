import React from 'react';
import { PartialTweet } from 'twitter-archive-reader';
// @ts-ignore
import D3WordCloud from '@alkihis/react-d3-cloud';
// @ts-ignore
import stopword from 'stopword';
import SETTINGS from '../../../tools/Settings';

type WCData = { text: string, value: number };
export default function WordCloud(props: { tweets: PartialTweet[] }) {
  const [data, setData] = React.useState<WCData[]>([]);

  React.useEffect(() => {
    (async () => {
      // Parse each tweet
      const word_to_count: { [word: string]: number } = {};
  
      function registerWord(word: string) {
        if (word && word.length > 1) {
          word = word.toLocaleLowerCase();
  
          if (word in word_to_count) {
            word_to_count[word]++;
          }
          else {
            word_to_count[word] = 1;
          }
        }
      }
  
      const word_boundary_regex = /[',":!?^$*`_;+=)(&.°\\/ \t\n]+/;
      const regex_url = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()[\]{};:'".,<>?«»“”‘’]))/g;
  
      for (const tweet of props.tweets) {
        // let seen_whitespace = true;
        const text = tweet.text.replace(regex_url, '');
        // let track = false;
        const words = stopword.removeStopwords(text.split(word_boundary_regex), SETTINGS.lang === "fr" ? stopword.fr : stopword.en);
        for (const word of words) {
          if (!word.startsWith('@') && !word.startsWith('#')) {
            registerWord(word);
          }
        }
      }

      const len = props.tweets.length;
      const threshold = len > 5000 ? 6 : (len > 1000 ? 4 : 2);
  
      const words_sorted = Object.entries(word_to_count)
        .map(([text, value]) => ({ text, value }))
        .filter(({ value }) => value < (len / threshold)) // Remove most frequent words
        .sort((a, b) => b.value - a.value)
        .slice(0, 300); // Keep the 300 first
  
      setData(words_sorted);
    })();
  }, [props]);

  const multiplicator = props.tweets.length > 1000 ? 1 : 2;

  return (
    <D3WordCloud 
      data={data} 
      rotate={(word: WCData) => (word.value % 60) - 30}
      fontSizeMapper={(word: WCData) => word.value * multiplicator}
    />
  );
}
