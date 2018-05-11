// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { OTP } from 'constants/navigationConstants';
import { Container, Wrapper, Footer, Center } from 'components/Layout';
import Button from 'components/Button';
import Emoji from 'components/Emoji';
import HyperLink from 'components/HyperLink';
import { Paragraph, Label } from 'components/Typography';
import Title from 'components/Title';
import FooterText from 'components/FooterText';
import { CountryPicker, CountryPickerWrapper } from 'components/CountryPicker';
import { Picker, Icon } from 'native-base';
import { LoginForm, PhoneInput } from 'components/Form';

import countries from 'utils/countries.json';

type Props = {
  navigation: NavigationScreenProp<*>,
}

type State = {
  selectedCountry: string,
  selectedCountryFlag: string,
  selectedCountryCallingCode: string,
}

class Signin extends React.Component<Props, State> {
  state = {
    selectedCountry: 'GB',
    selectedCountryFlag: '🇬🇧',
    selectedCountryCallingCode: '44',
  };

  generateCountryListPickerItems() {
    return Object.keys(countries)
      .map((key) => countries[key])
      .map((country) => (
        <Picker.Item
          label={country.name.common}
          flag={country.flag}
          value={country.cca2}
          key={country.cca2}
        />
      ));
  }

  handleValueChange(value: string) {
    const country = countries.find(({ cca2 }) => cca2 === value);
    this.setState({
      selectedCountry: value,
      selectedCountryFlag: country.flag || '🌍',
      selectedCountryCallingCode: country.callingCode || '00',
    });
  }

  loginAction = () => {
    this.props.navigation.navigate(OTP);
  };

  render() {
    return (
      <Container>
        <Wrapper padding>
          <Title title="login" />
          <Paragraph>Please enter the mobile number associated with your account.</Paragraph>
          <LoginForm>
            <Label>Country</Label>
            <CountryPickerWrapper>
              <Emoji>{this.state.selectedCountryFlag}</Emoji>
              <CountryPicker
                iosHeader="Select Country"
                iosIcon={<Icon name="ios-arrow-down-outline" />}
                mode="dropdown"
                selectedValue={this.state.selectedCountry}
                handleValueChange={this.handleValueChange}
              >
                {this.generateCountryListPickerItems()}
              </CountryPicker>
            </CountryPickerWrapper>
            <Label>Phone</Label>
            <PhoneInput
              defaultValue={`+${this.state.selectedCountryCallingCode}`}
              keyboardType="phone-pad"
            />
          </LoginForm>
        </Wrapper>
        <Footer>
          <Button block onPress={this.loginAction} title="Next" marginBottom="20px" />
          <Center>
            <FooterText>
              By signing into Pillar Wallet you are agreeing to our <HyperLink url="http://pillarproject.io/">Terms</HyperLink> and <HyperLink url="http://pillarproject.io/">Privacy policy</HyperLink>
            </FooterText>
          </Center>
        </Footer>
      </Container>
    );
  }
}

export default Signin;
