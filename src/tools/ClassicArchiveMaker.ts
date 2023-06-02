import JSZip from 'jszip';
import TwitterArchive from "twitter-archive-reader";

const ARCHIVE_URL = '/assets/classic_archive.zip';

export default new class ClassicArchiveMaker {
  async make(full_archive: TwitterArchive) {
    const archive_as_ab: ArrayBuffer = await fetch(ARCHIVE_URL).then(r => r.arrayBuffer());

    const created = await JSZip.loadAsync(archive_as_ab);

    // Create the CSV
    let csv_file = `"tweet_id","in_reply_to_status_id","in_reply_to_user_id","retweeted_status_id","retweeted_status_user_id","timestamp","source","text","expanded_urls"\n`;

    for (const tweet of full_archive.tweets) {
      csv_file += [
        tweet.id_str,
        tweet.in_reply_to_status_id_str || "",
        tweet.in_reply_to_user_id_str || "",
        tweet.retweeted_status ? tweet.retweeted_status.id_str : "",
        tweet.retweeted_status ? tweet.retweeted_status.user.id_str : "",
        tweet.created_at,
        tweet.source,
        tweet.text,
        ""
      ].map(e => e ? `"${e}"` : "").join(',') + "\n";
    }

    created.file("tweets.csv", csv_file);

    // Create the index + tweets files
    const js_dir = created.folder("data").folder("js");
    const tweet_dir = js_dir.folder("tweets");

    let tweet_index: {
      "file_name": string,
      "year": number,
      "var_name": string,
      "tweet_count": number,
      "month": number
    }[] = [];

    const index = full_archive.tweets.index;
    for (const year in index) {
      for (const month in index[year]) {
        const tweets = Object.values(index[year][month]);

        for (const tweet of tweets) {
          if (tweet.entities) {
            for (const type in tweet.entities) {
              // Convert every indices to Number, otherwise it will cause problems.
              // @ts-ignore
              for (const e of tweet.entities[type]) {
                e.indices = e.indices.map(Number);
              }
            }
          }
        }

        const full_month = String(month).padStart(2, "0");
        const file_name = `${year}_${full_month}.js`;
        const var_name = `tweets_${year}_${full_month}`;

        const file = `Grailbird.data.${var_name} = \n` + JSON.stringify(tweets, null, 2);
        tweet_dir.file(file_name, file);

        tweet_index.push({
          file_name: "data/js/tweets/" + file_name,
          year: Number(year),
          month: Number(month),
          tweet_count: tweets.length,
          var_name
        });
      }
    }

    tweet_index = tweet_index.sort((a, b) => {
      // Sort by the most recent FIRST (descending)
      if (a.year !== b.year) {
        return b.year - a.year;
      }
      return b.month - a.month;
    });

    // Save the index
    js_dir.file("tweet_index.js", `var tweet_index = ` + JSON.stringify(tweet_index, null, 2));

    // Construct the payload details
    js_dir.file("payload_details.js", "var payload_details = " + JSON.stringify({
      tweets: full_archive.tweets.length,
      created_at: new Date().toISOString(),
      lang: "en",
    }, null, 2));

    // Construct the user details
    js_dir.file("user_details.js", "var user_details = " + JSON.stringify(full_archive.user.summary, null, 2));

    // Render the archive
    const new_archive = await created.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });

    return new_archive;
  }
}();
