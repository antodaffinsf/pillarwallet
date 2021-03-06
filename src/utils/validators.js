// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import { utils } from 'ethers';
import { ETH } from 'constants/assetsConstants';
import { pipe, decodeETHAddress } from 'utils/common';
import t from 'translations/translate';

type AddressValidator = {
  validator: (address: string) => boolean,
  message: string,
};

export const validatePin = (pin: string, confirmationPin?: string): string => {
  if (pin.length !== 6) {
    return t('auth:error.invalidPin.tooLong', { requiredLength: 6 });
  } else if (!pin.match(/^\d+$/)) {
    return t('auth:error.invalidPin.useNumericSymbolsOnly');
  } else if (confirmationPin && pin !== confirmationPin) {
    return t('auth:error.invalidPin.doesNotMatchPrevious');
  }
  return '';
};

export const isEnsName = (input: string): boolean => {
  if (!input.toString().includes('.')) return false;

  const domain = input.split('.').pop().toLowerCase();
  const supportedDomains = ['eth'];

  if (supportedDomains.includes(domain)) {
    return true;
  }

  return false;
};

export const isValidETHAddress = (address: string): boolean => {
  let result = true;
  try {
    utils.getAddress(address);
  } catch (e) {
    result = false;
  }
  if (!result && isEnsName(address)) {
    result = true;
  }
  return result;
};

export const isValidAddress = (address: string): boolean => {
  return isValidETHAddress(address);
};

export const supportedAddressValidator = (address: string): boolean => {
  if (pipe(decodeETHAddress, isValidETHAddress)(address)) {
    return true;
  }
  return false;
};

export const addressValidator = (token: string): AddressValidator => {
  const validators = {
    [ETH]: {
      validator: isValidETHAddress,
      message: t('auth:error.invalidEthereumAddress.default'),
    },
  };

  const validator = validators[token];
  if (validator) {
    return validator;
  }

  return {
    validator: isValidAddress,
    message: t('auth:error.invalidAddress.default'),
  };
};

export function hasAllValues(object: ?Object) {
  // No param reassign makes eslint sad
  object = object || {}; // eslint-disable-line
  const keys = Object.keys(object);
  const values = Object.values(object).filter((value) => value !== undefined && value !== '');
  return keys.length === values.length;
}

export function isValidEmail(email: string) {
  // eslint-disable-next-line
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

export function isValidPhone(phone: string) {
  const re = /^(\+\d{10,20}\b)/;
  return re.test(phone);
}

export function isValidPhoneWithoutCountryCode(phone: string) {
  const re = /^(\d{5,20}$)/;
  return re.test(phone);
}
