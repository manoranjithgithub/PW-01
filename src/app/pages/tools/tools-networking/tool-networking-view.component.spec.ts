import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToolNetworkingViewComponent } from './tool-networking-view.component';

describe('ToolNetworkingViewComponent', () => {
    let component: ToolNetworkingViewComponent;
    let fixture: ComponentFixture<ToolNetworkingViewComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ToolNetworkingViewComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ToolNetworkingViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    describe('Input Properties', () => {
        it('should have allowGenerate default to false', () => {
            expect(component.allowGenerate).toBeFalse();
        });

        it('should accept viewdata input', () => {
            const mockData = {
                data: {
                    publicHost: 'example.com',
                    privateHost: 'internal.example.com',
                    name: 'test-tool'
                }
            };
            component.viewdata = mockData;
            fixture.detectChanges();
            expect(component.viewdata).toEqual(mockData);
        });

        it('should handle viewdata with null publicHost', () => {
            component.viewdata = {
                data: {
                    publicHost: null,
                    privateHost: 'private.example.com',
                    name: 'test-tool'
                }
            };
            fixture.detectChanges();
            expect(component.viewdata.data.publicHost).toBeNull();
        });

        it('should handle viewdata with port information', () => {
            component.viewdata = {
                data: {
                    publicPort: 443,
                    privatePort: 8080,
                    port: 3000,
                    name: 'test-tool'
                }
            };
            fixture.detectChanges();
            expect(component.viewdata.data.publicPort).toBe(443);
            expect(component.viewdata.data.privatePort).toBe(8080);
            expect(component.viewdata.data.port).toBe(3000);
        });
    });

    describe('copy method', () => {
        beforeEach(() => {
            // Ensure navigator.clipboard is available before each test
            if (!navigator.clipboard) {
                (navigator as any).clipboard = {
                    writeText: jasmine.createSpy('writeText')
                };
            }
        });

     
      
        describe('Fallback clipboard method', () => {
            let mockTextArea: HTMLTextAreaElement;
            let clipboardDescriptor: PropertyDescriptor | undefined;

            beforeEach(() => {
                // Save original clipboard descriptor
                clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
                
                // Mock clipboard as unavailable
                Object.defineProperty(navigator, 'clipboard', {
                    value: undefined,
                    writable: true,
                    configurable: true
                });

                // Create mock textarea
                mockTextArea = document.createElement('textarea');
                spyOn(document, 'createElement').and.returnValue(mockTextArea);
                spyOn(mockTextArea, 'select');
                spyOn(document, 'execCommand').and.returnValue(true);
                spyOn(document.body, 'appendChild').and.callThrough();
                spyOn(document.body, 'removeChild').and.callThrough();
            });

            afterEach(() => {
                // Restore original clipboard
                if (clipboardDescriptor) {
                    Object.defineProperty(navigator, 'clipboard', clipboardDescriptor);
                }
            });

            it('should create textarea element when clipboard API unavailable', () => {
                component.copy('fallback text');

                expect(document.createElement).toHaveBeenCalledWith('textarea');
            });

            it('should set textarea value to the text parameter', () => {
                component.copy('fallback text');

                expect(mockTextArea.value).toBe('fallback text');
            });

            it('should append textarea to document body', () => {
                component.copy('fallback text');

                expect(document.body.appendChild).toHaveBeenCalledWith(mockTextArea);
            });

            it('should select the textarea content', () => {
                component.copy('fallback text');

                expect(mockTextArea.select).toHaveBeenCalled();
            });

            it('should execute copy command', () => {
                component.copy('fallback text');

                expect(document.execCommand).toHaveBeenCalledWith('copy');
            });

            it('should remove textarea from document body after copy', () => {
                component.copy('fallback text');

                expect(document.body.removeChild).toHaveBeenCalledWith(mockTextArea);
            });

            it('should execute all fallback steps in correct order', () => {
                const callOrder: string[] = [];
                
                (document.createElement as jasmine.Spy).and.callFake(() => {
                    callOrder.push('createElement');
                    return mockTextArea;
                });
                (document.body.appendChild as jasmine.Spy).and.callFake(() => {
                    callOrder.push('appendChild');
                });
                (mockTextArea.select as jasmine.Spy).and.callFake(() => {
                    callOrder.push('select');
                });
                (document.execCommand as jasmine.Spy).and.callFake(() => {
                    callOrder.push('execCommand');
                    return true;
                });
                (document.body.removeChild as jasmine.Spy).and.callFake(() => {
                    callOrder.push('removeChild');
                });

                component.copy('test');

                expect(callOrder).toEqual([
                    'createElement',
                    'appendChild',
                    'select',
                    'execCommand',
                    'removeChild'
                ]);
            });

            it('should handle long text strings in fallback', () => {
                const longText = 'a'.repeat(1000);

                component.copy(longText);

                expect(mockTextArea.value).toBe(longText);
                expect(document.execCommand).toHaveBeenCalledWith('copy');
            });

            // it('should handle special characters in fallback', () => {
            //     const specialText = '<script>alert("test")</script>';

            //     component.copy(specialText);

            //     expect(mockTextArea.value).toBe(specialText);
            //     expect(document.execCommand).toHaveBeenCalledWith('copy');
            // });

            it('should handle URLs in fallback', () => {
                const url = 'https://example.com/path?query=value';

                component.copy(url);

                expect(mockTextArea.value).toBe(url);
                expect(document.execCommand).toHaveBeenCalledWith('copy');
            });
        });
       
    });

    describe('open method', () => {
        it('should open url with https if protocol is missing', () => {
            const openSpy = spyOn(window, 'open');

            component.open('example.com');

            expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank');
        });

        it('should open url as-is when protocol exists', () => {
            const openSpy = spyOn(window, 'open');

            component.open('http://example.com');

            expect(openSpy).toHaveBeenCalledWith('http://example.com', '_blank');
        });

        it('should not open window when url is undefined', () => {
            const openSpy = spyOn(window, 'open');

            component.open(undefined);

            expect(openSpy).not.toHaveBeenCalled();
        });

        it('should not open window when url is empty string', () => {
            const openSpy = spyOn(window, 'open');

            component.open('');

            expect(openSpy).not.toHaveBeenCalled();
        });

        it('should open https url with https protocol', () => {
            const openSpy = spyOn(window, 'open');

            component.open('https://secure.example.com');

            expect(openSpy).toHaveBeenCalledWith('https://secure.example.com', '_blank');
        });

        it('should handle subdomain urls without protocol', () => {
            const openSpy = spyOn(window, 'open');

            component.open('subdomain.example.com');

            expect(openSpy).toHaveBeenCalledWith('https://subdomain.example.com', '_blank');
        });

        it('should handle localhost urls', () => {
            const openSpy = spyOn(window, 'open');

            component.open('http://localhost:3000');

            expect(openSpy).toHaveBeenCalledWith('http://localhost:3000', '_blank');
        });
    });

    describe('requestGenerate method', () => {
        it('should emit generateHost event', () => {
            spyOn(component.generateHost, 'emit');

            component.requestGenerate();

            expect(component.generateHost.emit).toHaveBeenCalled();
        });

        it('should emit generateHost without parameters', () => {
            spyOn(component.generateHost, 'emit');

            component.requestGenerate();

            expect(component.generateHost.emit).toHaveBeenCalledWith();
        });

        it('should trigger generateHost subscription', (done) => {
            component.generateHost.subscribe(() => {
                expect(true).toBe(true);
                done();
            });

            component.requestGenerate();
        });
    });

    describe('generateHost Output', () => {
        it('should have generateHost EventEmitter defined', () => {
            expect(component.generateHost).toBeDefined();
        });

        it('should initially have no observers', () => {
            expect(component.generateHost.observers.length).toBe(0);
        });
    });

    describe('Edge Cases and Integration', () => {
        it('should handle viewdata without nested data property', () => {
            component.viewdata = {
                publicHost: 'example.com',
                privateHost: 'internal.example.com',
                name: 'direct-tool'
            };
            fixture.detectChanges();
            expect(component.viewdata.publicHost).toBe('example.com');
        });

        it('should handle undefined viewdata gracefully', () => {
            component.viewdata = undefined;
            fixture.detectChanges();
            expect(component.viewdata).toBeUndefined();
        });

        it('should toggle allowGenerate from false to true', () => {
            expect(component.allowGenerate).toBeFalse();
            component.allowGenerate = true;
            fixture.detectChanges();
            expect(component.allowGenerate).toBeTrue();
        });

        // it('should handle copy and open operations in sequence', () => {
        //     const clipboardSpy = spyOn(navigator.clipboard, 'writeText');
        //     const openSpy = spyOn(window, 'open');

        //     component.copy('https://example.com');
        //     component.open('https://example.com');

        //     expect(clipboardSpy).toHaveBeenCalledWith('https://example.com');
        //     expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank');
        // });

        // it('should handle multiple copy operations', () => {
        //     const clipboardSpy = spyOn(navigator.clipboard, 'writeText');

        //     component.copy('first-url');
        //     component.copy('second-url');
        //     component.copy('third-url');

        //     expect(clipboardSpy).toHaveBeenCalledTimes(3);
        // });

        it('should handle viewdata with only port field', () => {
            component.viewdata = {
                data: {
                    port: 8080,
                    name: 'test-tool'
                }
            };
            fixture.detectChanges();
            expect(component.viewdata.data.port).toBe(8080);
            expect(component.viewdata.data.publicPort).toBeUndefined();
            expect(component.viewdata.data.privatePort).toBeUndefined();
        });
    });

    it('should not attempt copy when text is undefined', () => {
        spyOn(document, 'createElement');

        component.copy(undefined);

        expect(document.createElement).not.toHaveBeenCalled();
    });
   
});
