import { useLocalStorage } from '../src';
import { renderHook, act } from '@testing-library/react-hooks';
import * as utils from '../src/utils';
import {
  renderHook as renderSSR,
  act as actSSR,
} from '@testing-library/react-hooks/server';

const localStorageGetItemSpy = jest.spyOn(window.localStorage.__proto__, 'getItem');
const localStorageSetItemSpy = jest.spyOn(window.localStorage.__proto__, 'setItem');
const consoleWarnSpy = jest.spyOn(console, 'warn');

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorageGetItemSpy.mockReset();
    localStorageSetItemSpy.mockReset();
    consoleWarnSpy.mockImplementation(() => {});
    localStorage.clear();
    // @ts-ignore
    utils.isClient = true;
  });

  it('should return initial value when localStorage is not accessible', () => {
    // given
    renderHook(() => {
      const [, setTodos] = useLocalStorage('todos', ['todo_1', 'todo_2']);
      setTodos(['todo_1', 'todo_2', 'todo_3']);
    });
    localStorageGetItemSpy.mockImplementation(() => {
      throw new Error('Some error');
    });

    // when
    const { result } = renderHook(() => useLocalStorage('todos', ['todo_1', 'todo_2']));

    // then
    expect(result.current[0]).toEqual(['todo_1', 'todo_2']);
  });

  it('should not store value when localStorage is not accessible', () => {
    // given
    localStorageSetItemSpy.mockImplementation(() => {
      throw Error('Some error');
    });

    // when
    // then
    const { result } = renderHook(() => useLocalStorage('todos', ['todo_1', 'todo_2']));
    act(() => {
      result.current[1](['todo_1', 'todo_2', 'todo_3']);
      expect(result.current[0]).toEqual(['todo_1', 'todo_2']);
    });
  });

  it('should return existing value in localStorage', () => {
    // given
    localStorageGetItemSpy.mockReturnValue('["todo_6","todo_7"]');
    // when
    const { result } = renderHook(() => useLocalStorage('todos', ['todo_1', 'todo_2']));
    // then
    expect(result.current[0]).toEqual(['todo_6', 'todo_7']);
  });

  it('should return initial value', () => {
    // given
    // when
    const { result } = renderHook(() => useLocalStorage('todos', ['todo_1', 'todo_2']));
    // then
    expect(result.current[0]).toEqual(['todo_1', 'todo_2']);
  });

  it('should set value via functional update () => {...}', () => {
    // given
    const { result } = renderHook(() => useLocalStorage('todos', ['todo_1', 'todo_2']));
    // when
    act(() => result.current[1](() => ['todo_1', 'todo_3']));
    // then
    expect(result.current[0]).toEqual(['todo_1', 'todo_3']);
  });

  it('should support SSR without errors - #1', () => {
    // given
    // when
    const { result } = renderSSR(() => useLocalStorage('todos', ['todo_11', 'todo_21']));
    actSSR(() => result.current[1](['todo_1', 'todo_2', 'todo_3']));
    // then
    expect(result.current[0]).toEqual(['todo_11', 'todo_21']);
  });

  it('should support SSR without errors - #2', () => {
    // given
    // @ts-ignore
    utils.isClient = false;

    // when
    const { result } = renderHook(() => useLocalStorage('todos', ['todo_1', 'todo_2']));
    act(() => {
      result.current[1](['todo_1', 'todo_2', 'todo_3']);
    });
    // then
    expect(result.current[0]).toEqual(['todo_1', 'todo_2']);
  });

  it('should return stored value after hydration in SSR', () => {
    // given
    const { result, hydrate } = renderSSR(() =>
      useLocalStorage('todos5', ['todo_11', 'todo_21'])
    );
    // when
    hydrate();
    actSSR(() => result.current[1](['todo_1', 'todo_2', 'todo_3']));
    // then
    expect(result.current[0]).toEqual(['todo_1', 'todo_2', 'todo_3']);
  });

  it('should set new value', () => {
    // given
    const { result } = renderHook(() => useLocalStorage('todos', ['todo_1', 'todo_2']));
    // when
    act(() => result.current[1](['todo_1', 'todo_2', 'todo_3']));
    // then
    expect(result.current[0]).toEqual(['todo_1', 'todo_2', 'todo_3']);
  });

  it('should throw error when multiple hook instances detected', () => {
    // given
    const { result } = renderHook(() => {
      useLocalStorage('todos', ['todo_1', 'todo_2']);
      useLocalStorage('todos', ['todo_3', 'todo_4']);
    });

    // then
    expect(result.error).toEqual(
      Error(
        'Detected multiple instances of useLocalStorage for the same key todos. Please consider using global state.'
      )
    );
  });

  it('storage event should not update state if sync option disabled', () => {
    // given
    const { result } = renderHook(() => useLocalStorage('todos', ['todo_1', 'todo_2']));
    // when
    act(() => {
      localStorage.setItem('todos', JSON.stringify(['todo_3', 'todo_4']));
      window.dispatchEvent(
        new StorageEvent('storage', {
          storageArea: localStorage,
          key: 'todos',
          oldValue: JSON.stringify(['todo_1', 'todo_2']),
          newValue: JSON.stringify(['todo_3', 'todo_4']),
        })
      );
    });
    // then
    expect(result.current[0]).toEqual(['todo_1', 'todo_2']);
  });

  it('storage event should update state if sync option enabled', () => {
    // given
    const { result } = renderHook(() =>
      useLocalStorage('todos', ['todo_1', 'todo_2'], { sync: true })
    );
    // when
    act(() => {
      localStorage.setItem('todos', JSON.stringify(['todo_3', 'todo_4']));
      window.dispatchEvent(
        new StorageEvent('storage', {
          storageArea: localStorage,
          key: 'todos',
          oldValue: JSON.stringify(['todo_1', 'todo_2']),
          newValue: JSON.stringify(['todo_3', 'todo_4']),
        })
      );
    });
    // then
    expect(result.current[0]).toEqual(['todo_3', 'todo_4']);
  });

  it('storage event should update state with initial value if new value is undefined/null (sync option enabled)', () => {
    // given
    const { result } = renderHook(() =>
      useLocalStorage('todos', ['todo_1', 'todo_2'], { sync: true })
    );
    // when
    act(() => {
      localStorage.setItem('todos', JSON.stringify(['todo_3', 'todo_4']));
      window.dispatchEvent(
        new StorageEvent('storage', {
          storageArea: localStorage,
          key: 'todos',
          oldValue: JSON.stringify(['todo_1', 'todo_2']),
          newValue: undefined,
        })
      );
    });
    // then
    expect(result.current[0]).toEqual(['todo_1', 'todo_2']);
  });

  it('storage event of different key should be ignored (sync option enabled)', () => {
    // given
    const { result } = renderHook(() =>
      useLocalStorage('todos', ['todo_1', 'todo_2'], { sync: true })
    );
    // when
    act(() => {
      localStorage.setItem('todos', JSON.stringify(['todo_1', 'todo_2']));
      window.dispatchEvent(
        new StorageEvent('storage', {
          storageArea: localStorage,
          key: 'todos_',
          oldValue: JSON.stringify(['todo_1', 'todo_2']),
          newValue: JSON.stringify(['todo_3', 'todo_4']),
        })
      );
    });
    // then
    expect(result.current[0]).toEqual(['todo_1', 'todo_2']);
  });
});
