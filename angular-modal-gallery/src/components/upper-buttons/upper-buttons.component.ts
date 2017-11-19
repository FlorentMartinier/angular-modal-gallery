/*
 The MIT License (MIT)

 Copyright (c) 2017 Stefano Cappa (Ks89)

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */

import { Input, Output, EventEmitter, Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import {
  ButtonConfig, ButtonEvent, ButtonsConfig, ButtonSize,
  ButtonsStrategy, ButtonType, WHITELIST_BUTTON_TYPES
} from '../../interfaces/buttons-config.interface';
import { Image } from '../../interfaces/image.class';
import { AccessibleComponent } from '../accessible.component';
import { NEXT } from '../../utils/user-input.util';

export interface InternalButtonConfig extends ButtonConfig {
  id?: number; // useful only for trackById, not needed by users
}

/**
 * Component with all upper right buttons.
 * In fact, it uses a template with extUrl, download and close buttons with the right directive.
 * Also it emits click events as outputs.
 */
@Component({
  selector: 'ks-upper-buttons',
  styleUrls: ['upper-buttons.scss'],
  templateUrl: 'upper-buttons.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpperButtonsComponent extends AccessibleComponent implements OnInit {

  @Input() image: Image;
  @Input() buttonsConfig: ButtonsConfig;

  @Output() refresh: EventEmitter<ButtonEvent> = new EventEmitter<ButtonEvent>();
  @Output() delete: EventEmitter<ButtonEvent> = new EventEmitter<ButtonEvent>();
  @Output() navigate: EventEmitter<ButtonEvent> = new EventEmitter<ButtonEvent>();
  @Output() download: EventEmitter<ButtonEvent> = new EventEmitter<ButtonEvent>();
  @Output() close: EventEmitter<ButtonEvent> = new EventEmitter<ButtonEvent>();
  @Output() customEmit: EventEmitter<ButtonEvent> = new EventEmitter<ButtonEvent>();

  buttons: InternalButtonConfig[];

  private defaultSize: ButtonSize = {height: 30, width: 30, unit: 'px'};

  private defaultButtonsDefault: ButtonConfig[] = [{
    className: 'close-image',
    size: this.defaultSize,
    type: ButtonType.CLOSE,
    title: 'Close this modal image gallery',
    ariaLabel: 'Close this modal image gallery'
  }];

  private simpleButtonsDefault: ButtonConfig[] = [
    {
      className: 'download-image',
      size: this.defaultSize,
      type: ButtonType.DOWNLOAD,
      title: 'Download the current image',
      ariaLabel: 'Download the current image'
    },
    ...this.defaultButtonsDefault
  ];

  private advancedButtonsDefault: ButtonConfig[] = [
    {
      className: 'ext-url-image',
      size: this.defaultSize,
      type: ButtonType.EXTURL,
      title: 'Navigate the current image',
      ariaLabel: 'Navigate the current image'
    },
    ...this.simpleButtonsDefault
  ];

  private fullButtonsDefault: ButtonConfig[] = [
    {
      className: 'refresh-image',
      size: this.defaultSize,
      type: ButtonType.REFRESH,
      title: 'Refresh all images',
      ariaLabel: 'Refresh all images'
    },
    {
      className: 'delete-image',
      size: this.defaultSize,
      type: ButtonType.DELETE,
      title: 'Delete the current image',
      ariaLabel: 'Delete the current image'
    },
    ...this.advancedButtonsDefault
  ];

  ngOnInit() {
    if (!this.buttonsConfig || !this.buttonsConfig.strategy) {
      throw new Error(`ButtonsConfig's strategy is a mandatory field`);
    }

    switch (this.buttonsConfig.strategy) {
      case ButtonsStrategy.SIMPLE:
        this.buttons = this.addButtonIds(this.simpleButtonsDefault);
        break;
      case ButtonsStrategy.ADVANCED:
        this.buttons = this.addButtonIds(this.advancedButtonsDefault);
        break;
      case ButtonsStrategy.FULL:
        this.buttons = this.addButtonIds(this.fullButtonsDefault);
        break;
      case ButtonsStrategy.CUSTOM:
        this.buttons = this.addButtonIds(this.initCustomButtons());
        break;
      case ButtonsStrategy.DEFAULT:
      default:
        this.buttons = this.addButtonIds(this.defaultButtonsDefault);
        break;
    }
  }

  onEvent(button: InternalButtonConfig, index: number, event: KeyboardEvent | MouseEvent) {
    if (!event) {
      return;
    }
    switch (button.type) {
      case ButtonType.REFRESH:
        this.triggerOnMouseAndKeyboard(this.refresh, event, button, index, true);
        break;
      case ButtonType.DELETE:
        this.triggerOnMouseAndKeyboard(this.delete, event, button, index, true);
        break;
      case ButtonType.EXTURL:
        if (!this.image || !this.image.extUrl) {
          return;
        }
        this.triggerOnMouseAndKeyboard(this.navigate, event, button, index, this.image.extUrl);
        break;
      case ButtonType.DOWNLOAD:
        this.triggerOnMouseAndKeyboard(this.download, event, button, index, true);
        break;
      case ButtonType.CLOSE:
        this.triggerOnMouseAndKeyboard(this.close, event, button, index, true);
        break;
      case ButtonType.CUSTOM:
        this.triggerOnMouseAndKeyboard(this.customEmit, event, button, index, true);
        break;
      default:
        throw new Error(`Unknown button's type into ButtonConfig`);
    }
  }

  trackById(index: number, item: InternalButtonConfig) {
    return item.id;
  }

  private triggerOnMouseAndKeyboard(emitter: EventEmitter<ButtonEvent>,
                                    event: KeyboardEvent | MouseEvent,
                                    btnSource: ButtonConfig,
                                    btnIndex: number,
                                    data: any) {
    if (!emitter) {
      console.error('UpperButtonsComponent unknown emitter in triggerOnMouseAndKeyboard');
    }

    const dataToEmit: ButtonEvent = {
      index: btnIndex,
      button: btnSource,
      payload: data
    };

    const result: number = super.handleImageEvent(event);
    if (result === NEXT) {
      emitter.emit(dataToEmit);
    }
  }

  private addButtonIds(buttons: ButtonConfig[]) {
    return buttons.map((val: ButtonConfig, i: number) => {
      const btn: InternalButtonConfig = Object.assign({}, val);
      btn.id = i;
      return btn;
    });
  }

  private initCustomButtons(): ButtonConfig[] {
    // init with default values
    const buttonsConfig: ButtonsConfig = Object.assign({}, this.buttonsConfig);
    buttonsConfig.buttons = buttonsConfig.buttons || [];

    buttonsConfig.buttons.forEach((val: ButtonConfig) => {
      const isValidBtnType: ButtonType | void = WHITELIST_BUTTON_TYPES
        .find((btnType: ButtonType) => btnType === val.type);

      if (!isValidBtnType) {
        throw new Error(`Unknown ButtonType. For custom types use ButtonType.CUSTOM`);
      }
    });
    return buttonsConfig.buttons;
  }
}
