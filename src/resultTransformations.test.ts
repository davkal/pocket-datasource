import {getTimeSeriesFromResponse} from './resultTransformations';
import RESPONSE from './sampleResponse';

describe('Pocket response parser', () => {
  describe('getTimeSeriesFromResult()', () => {
    it('expects time series of cumulative values', () => {
      const series = getTimeSeriesFromResponse(RESPONSE);
      expect(series.length).toBe(1);
      expect(series[0].datapoints.length).toBe(2);
      expect(series[0].datapoints[0][0]).toBe(1);
      expect(series[0].datapoints[1][0]).toBe(2);
      expect(series[0].datapoints[0][1]).toBe(3000);
      expect(series[0].datapoints[1][1]).toBe(4000);
    });

    it('expects time series for daily adds', () => {
      const series = getTimeSeriesFromResponse(RESPONSE, 'daily_adds');
      expect(series.length).toBe(1);
      expect(series[0].datapoints.length).toBe(1);
      expect(series[0].datapoints[0][0]).toBe(2);
      expect(series[0].datapoints[0][1]).toBe(0);
    });
    it('expects time series for daily reads', () => {
      const series = getTimeSeriesFromResponse(RESPONSE, 'daily_reads');
      expect(series.length).toBe(1);
      expect(series[0].datapoints.length).toBe(1);
      expect(series[0].datapoints[0][0]).toBe(1);
      expect(series[0].datapoints[0][1]).toBe(0);
    });
  });
});
