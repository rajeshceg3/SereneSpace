import {beforeEach,describe,expect,it,vi} from 'vitest';
import {useTelemetryStore} from '../../stores/useTelemetryStore';
describe('session archive commit boundary',()=>{
 beforeEach(()=>{localStorage.clear();useTelemetryStore.setState({sessionData:[{timestamp:1000,value:0.2},{timestamp:2000,value:0.4}],sessionPath:[{x:1,y:2,z:3,stress:0.2,coherence:80,timestamp:1000}],history:[],isDebriefOpen:true,archiveError:''});vi.restoreAllMocks();});
 it('keeps live data, history and debrief after quota failure',()=>{
  localStorage.setItem('telemetry_history','[]');const before=useTelemetryStore.getState();
  vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('quota');});
  expect(before.archiveSession()).toBe(false);const after=useTelemetryStore.getState();
  expect(after.sessionData).toBe(before.sessionData);expect(after.sessionPath).toBe(before.sessionPath);expect(after.history).toBe(before.history);expect(after.isDebriefOpen).toBe(true);expect(after.archiveError).toContain('not saved');expect(localStorage.getItem('telemetry_history')).toBe('[]');
 });
 it('retry commits exactly once and clears the notice',()=>{
  const fail=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('blocked');});
  expect(useTelemetryStore.getState().archiveSession()).toBe(false);fail.mockRestore();
  expect(useTelemetryStore.getState().archiveSession()).toBe(true);
  expect(useTelemetryStore.getState().history).toHaveLength(1);expect(useTelemetryStore.getState().sessionData).toEqual([]);expect(useTelemetryStore.getState().archiveError).toBe('');expect(JSON.parse(localStorage.getItem('telemetry_history')!)).toHaveLength(1);
 });
 it('does not report empty session as saved',()=>{useTelemetryStore.setState({sessionData:[]});expect(useTelemetryStore.getState().archiveSession()).toBe(false);expect(useTelemetryStore.getState().archiveError).toContain('no session');});
});
