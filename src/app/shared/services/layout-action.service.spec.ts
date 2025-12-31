import { TestBed } from '@angular/core/testing';
import { LayoutActionService } from './layout-action.service';

describe('LayoutActionService', () => {
  let service: LayoutActionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LayoutActionService]
    });
    service = TestBed.inject(LayoutActionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('actionClick$', () => {
    it('should be defined', () => {
      expect(service.actionClick$).toBeDefined();
    });

    it('should emit when triggerAction is called', (done) => {
      service.actionClick$.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      service.triggerAction();
    });

    it('should emit multiple times when triggerAction is called multiple times', (done) => {
      let emissionCount = 0;

      service.actionClick$.subscribe(() => {
        emissionCount++;
        if (emissionCount === 3) {
          expect(emissionCount).toBe(3);
          done();
        }
      });

      service.triggerAction();
      service.triggerAction();
      service.triggerAction();
    });

    it('should not emit initial value', (done) => {
      let emitted = false;

      service.actionClick$.subscribe(() => {
        emitted = true;
      });

      setTimeout(() => {
        expect(emitted).toBe(false);
        done();
      }, 50);
    });
  });

  describe('extraTitle$', () => {
    it('should be defined', () => {
      expect(service.extraTitle$).toBeDefined();
    });

    it('should emit initial value of null', (done) => {
      service.extraTitle$.subscribe(value => {
        expect(value).toBeNull();
        done();
      });
    });

    it('should emit new title when setExtraTitle is called', (done) => {
      const testTitle = 'Test Title';
      let emissionCount = 0;

      service.extraTitle$.subscribe(value => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(value).toBe(testTitle);
          done();
        }
      });

      service.setExtraTitle(testTitle);
    });

    it('should emit null when clearExtraTitle is called', (done) => {
      const testTitle = 'Test Title';
      let emissionCount = 0;

      service.extraTitle$.subscribe(value => {
        emissionCount++;
        if (emissionCount === 1) {
          expect(value).toBeNull(); // Initial value
        } else if (emissionCount === 2) {
          expect(value).toBe(testTitle); // After setExtraTitle
        } else if (emissionCount === 3) {
          expect(value).toBeNull(); // After clearExtraTitle
          done();
        }
      });

      service.setExtraTitle(testTitle);
      service.clearExtraTitle();
    });

    it('should update title multiple times', (done) => {
      const titles = ['Title 1', 'Title 2', 'Title 3'];
      let emissionCount = 0;

      service.extraTitle$.subscribe(value => {
        if (emissionCount === 0) {
          expect(value).toBeNull();
        } else if (emissionCount > 0 && emissionCount <= 3) {
          expect(value).toBe(titles[emissionCount - 1]);
        }
        
        emissionCount++;
        
        if (emissionCount === 4) {
          done();
        }
      });

      titles.forEach(title => service.setExtraTitle(title));
    });

    it('should handle empty string title', (done) => {
      let emissionCount = 0;

      service.extraTitle$.subscribe(value => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(value).toBe('');
          done();
        }
      });

      service.setExtraTitle('');
    });

    it('should handle special characters in title', (done) => {
      const specialTitle = '!@#$%^&*()_+-=[]{}|;:"<>?,./`~';
      let emissionCount = 0;

      service.extraTitle$.subscribe(value => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(value).toBe(specialTitle);
          done();
        }
      });

      service.setExtraTitle(specialTitle);
    });

    it('should handle very long title', (done) => {
      const longTitle = 'A'.repeat(1000);
      let emissionCount = 0;

      service.extraTitle$.subscribe(value => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(value).toBe(longTitle);
          expect(value?.length).toBe(1000);
          done();
        }
      });

      service.setExtraTitle(longTitle);
    });
  });

  describe('Integration tests', () => {
    it('should handle both action trigger and title update independently', (done) => {
      let actionTriggered = false;
      let titleSet = false;
      const testTitle = 'Integration Test';

      service.actionClick$.subscribe(() => {
        actionTriggered = true;
        checkCompletion();
      });

      let emissionCount = 0;
      service.extraTitle$.subscribe(value => {
        emissionCount++;
        if (emissionCount === 2 && value === testTitle) {
          titleSet = true;
          checkCompletion();
        }
      });

      function checkCompletion() {
        if (actionTriggered && titleSet) {
          expect(actionTriggered).toBe(true);
          expect(titleSet).toBe(true);
          done();
        }
      }

      service.setExtraTitle(testTitle);
      service.triggerAction();
    });

    it('should maintain separate subscriptions for different subscribers', (done) => {
      const testTitle = 'Subscriber Test';
      let subscriber1Count = 0;
      let subscriber2Count = 0;

      service.extraTitle$.subscribe(value => {
        subscriber1Count++;
      });

      service.extraTitle$.subscribe(value => {
        subscriber2Count++;
        if (subscriber2Count === 2) {
          expect(subscriber1Count).toBe(2);
          expect(subscriber2Count).toBe(2);
          done();
        }
      });

      service.setExtraTitle(testTitle);
    });

    it('should handle rapid successive calls to triggerAction', (done) => {
      let emissionCount = 0;
      const expectedEmissions = 10;

      service.actionClick$.subscribe(() => {
        emissionCount++;
        if (emissionCount === expectedEmissions) {
          expect(emissionCount).toBe(expectedEmissions);
          done();
        }
      });

      for (let i = 0; i < expectedEmissions; i++) {
        service.triggerAction();
      }
    });

    it('should handle rapid title changes', (done) => {
      let lastEmission: string | null = null;
      let emissionCount = 0;
      const numberOfChanges = 5;

      service.extraTitle$.subscribe(value => {
        lastEmission = value;
        emissionCount++;
        if (emissionCount === numberOfChanges + 1) { // +1 for initial null
          expect(lastEmission).toBe(`Title ${numberOfChanges - 1}`);
          done();
        }
      });

      for (let i = 0; i < numberOfChanges; i++) {
        service.setExtraTitle(`Title ${i}`);
      }
    });

    it('should clear and set title alternately', (done) => {
      const emissions: (string | null)[] = [];

      service.extraTitle$.subscribe(value => {
        emissions.push(value);
        if (emissions.length === 7) { // initial null + 3 sets + 3 clears
          expect(emissions[0]).toBeNull();
          expect(emissions[1]).toBe('Title 1');
          expect(emissions[2]).toBeNull();
          expect(emissions[3]).toBe('Title 2');
          expect(emissions[4]).toBeNull();
          expect(emissions[5]).toBe('Title 3');
          expect(emissions[6]).toBeNull();
          done();
        }
      });

      service.setExtraTitle('Title 1');
      service.clearExtraTitle();
      service.setExtraTitle('Title 2');
      service.clearExtraTitle();
      service.setExtraTitle('Title 3');
      service.clearExtraTitle();
    });
  });

  describe('Memory and cleanup', () => {
    it('should allow unsubscribing from actionClick$', (done) => {
      let emissionCount = 0;

      const subscription = service.actionClick$.subscribe(() => {
        emissionCount++;
      });

      service.triggerAction();
      subscription.unsubscribe();
      service.triggerAction();

      setTimeout(() => {
        expect(emissionCount).toBe(1);
        done();
      }, 50);
    });

    it('should allow unsubscribing from extraTitle$', (done) => {
      let emissionCount = 0;

      const subscription = service.extraTitle$.subscribe(() => {
        emissionCount++;
      });

      service.setExtraTitle('Test');
      subscription.unsubscribe();
      service.setExtraTitle('Test 2');

      setTimeout(() => {
        expect(emissionCount).toBe(2); // Initial null + first setExtraTitle
        done();
      }, 50);
    });
  });

  describe('Edge cases', () => {
    it('should handle null title (via clearExtraTitle)', (done) => {
      let emissionCount = 0;

      service.extraTitle$.subscribe(value => {
        emissionCount++;
        if (emissionCount === 1) {
          expect(value).toBeNull();
          done();
        }
      });
    });

    it('should handle unicode characters in title', (done) => {
      const unicodeTitle = '你好世界 🌍 مرحبا العالم';
      let emissionCount = 0;

      service.extraTitle$.subscribe(value => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(value).toBe(unicodeTitle);
          done();
        }
      });

      service.setExtraTitle(unicodeTitle);
    });

    it('should handle whitespace-only title', (done) => {
      const whitespaceTitle = '   \t\n   ';
      let emissionCount = 0;

      service.extraTitle$.subscribe(value => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(value).toBe(whitespaceTitle);
          done();
        }
      });

      service.setExtraTitle(whitespaceTitle);
    });

    it('should set same title multiple times', (done) => {
      const sameTitle = 'Same Title';
      const emissions: (string | null)[] = [];

      service.extraTitle$.subscribe(value => {
        emissions.push(value);
        if (emissions.length === 4) { // initial null + 3 same titles
          expect(emissions[0]).toBeNull();
          expect(emissions[1]).toBe(sameTitle);
          expect(emissions[2]).toBe(sameTitle);
          expect(emissions[3]).toBe(sameTitle);
          done();
        }
      });

      service.setExtraTitle(sameTitle);
      service.setExtraTitle(sameTitle);
      service.setExtraTitle(sameTitle);
    });
  });
});
