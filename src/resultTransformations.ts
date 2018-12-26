import _ from 'lodash';

export const parseTime = (input: string) => Date.parse(input);

export function parseResults(response: string): any[] {
  return response.trim().split(/\n\s*\s/);
}

const STATUS_NAMES = {
  '0': 'unread',
  '1': 'archived',
  '2': 'to be deleted',
};

/**
 * Turns a the response list of articles into a timeseries.
 * The list is in the shape of a map: id => article.
 */
export function getTimeSeriesFromResponse(result: any, query?: string): any[] {
  if (query === 'daily_adds') {
    return getDailyAdds(result);
  }
  if (query === 'daily_reads') {
    return getDailyReads(result);
  }
  return getCumulativeCounts(result);
}

export function getCumulativeCounts(result: any): any[] {
  // Group by status (unread vs archived)
  const groupedArticles = _.groupBy(result.list, 'status');

  // Calculate accumulative counts for each article group
  const seriesList: any[] = [];
  _.each(groupedArticles, (articles, status) => {
    let count = 0;
    const datapoints: any[] = [];
    const sortedArticles = _.sortBy(articles, 'time_updated');
    _.each(sortedArticles, (article: any) => {
      count += 1;
      const ts = parseInt(article.time_updated) * 1000;
      datapoints.push([count, ts]);
    });
    const target = STATUS_NAMES[status] || 'unknown';
    seriesList.push({datapoints, target});
  });

  return seriesList;
}

export function getDailyAdds(result: any): any[] {
  // Calculate daily adds
  let currentDay = -1;
  const datapoints: any[] = [];
  const sortedArticles = _.sortBy(result.list, 'time_added');
  _.each(sortedArticles, (article: any) => {
    // This is quite crude
    const day = Math.floor(parseInt(article.time_added) / 3600 / 24);
    if (day > currentDay) {
      datapoints.push([1, day * 24 * 3600 * 1000]);
      currentDay = day;
    } else {
      datapoints[datapoints.length - 1][0]++;
    }
  });

  return [{datapoints, target: 'Daily adds'}];
}

export function getDailyReads(result: any): any[] {
  // Calculate daily adds
  let currentDay = -1;
  const datapoints: any[] = [];
  const filteredArticles = _.filter(
    result.list,
    (article: any) => article.time_read !== '0'
  );
  const sortedArticles = _.sortBy(filteredArticles, 'time_read');
  _.each(sortedArticles, (article: any) => {
    // This is quite crude
    const day = Math.floor(parseInt(article.time_read) / 3600 / 24);
    if (day > currentDay) {
      datapoints.push([1, day * 24 * 3600 * 1000]);
      currentDay = day;
    } else {
      datapoints[datapoints.length - 1][0]++;
    }
  });

  return [{datapoints, target: 'Daily reads'}];
}
