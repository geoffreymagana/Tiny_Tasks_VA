
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface StaffInviteEmailProps {
  staffName?: string;
  staffEmail?: string;
  temporaryPassword?: string;
  agencyName?: string;
  agencyLogoUrl?: string;
  signInLink?: string;
  adminUsername?: string; // The admin who sent the invite
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'; // Fallback for local dev

export const StaffInviteEmail = ({
  staffName,
  staffEmail,
  temporaryPassword,
  agencyName = "Tiny Tasks",
  agencyLogoUrl = `${baseUrl}/static/agency-logo.png`, // Placeholder, update with actual or dynamic logo
  signInLink = `${baseUrl}/auth`,
  adminUsername = "The Admin Team",
}: StaffInviteEmailProps) => {
  const previewText = `You're invited to join ${agencyName}!`;

  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Preview>{previewText}</Preview>
          <Container className="mx-auto my-[40px] max-w-[480px] rounded border border-[#eaeaea] border-solid p-[20px]">
            <Section className="mt-[28px] text-center">
              <Img
                src={agencyLogoUrl}
                width="80" // Adjusted size for agency logo
                height="80"
                alt={`${agencyName} Logo`}
                className="mx-auto my-0 rounded-md"
              />
            </Section>
            <Heading className="mx-0 my-[25px] p-0 text-center font-normal text-[24px] text-black">
              Welcome to <strong>{agencyName}</strong>!
            </Heading>
            <Text className="text-[14px] text-black leading-[24px]">
              Hello {staffName || 'New Staff Member'},
            </Text>
            <Text className="text-[14px] text-black leading-[24px]">
              {adminUsername} has invited you to join the <strong>{agencyName}</strong> team.
              An account has been created for you.
            </Text>

            <Section className="my-[28px] rounded-md bg-gray-100 p-[20px] text-center">
              <Heading as="h2" className="mt-0 mb-[15px] text-[18px] font-semibold text-black">
                Your Login Credentials:
              </Heading>
              <Text className="text-[14px] text-black leading-[22px]">
                <strong>Email:</strong> {staffEmail}
              </Text>
              <Text className="text-[14px] text-black leading-[22px]">
                <strong>Temporary Password:</strong> {temporaryPassword}
              </Text>
              <Text className="mt-[15px] text-[13px] text-gray-700 leading-[20px]">
                Please sign in using these credentials and change your password immediately for security.
              </Text>
            </Section>

            <Section className="mt-[28px] mb-[28px] text-center">
              <Button
                className="rounded bg-[#00274d] px-6 py-3 text-center font-semibold text-[13px] text-white no-underline"
                href={signInLink}
              >
                Sign In & Join the Team
              </Button>
            </Section>
            <Text className="text-[14px] text-black leading-[24px]">
              Or copy and paste this URL into your browser:{' '}
              <Link href={signInLink} className="text-blue-600 no-underline">
                {signInLink}
              </Link>
            </Text>
            <Hr className="mx-0 my-[26px] w-full border border-[#eaeaea] border-solid" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This invitation was intended for{' '}
              <span className="text-black">{staffEmail}</span>. If you
              were not expecting this invitation, please disregard this email. If
              you are concerned about your account's safety, please reply to
              this email or contact your agency administrator.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

StaffInviteEmail.PreviewProps = {
  staffName: 'Alex Johnson',
  staffEmail: 'alex.johnson@example.com',
  temporaryPassword: 'Password123!',
  agencyName: 'Tiny Tasks VA Services',
  agencyLogoUrl: `https://placehold.co/100x100/00274d/ffffff?text=TT`,
  signInLink: 'http://localhost:9002/auth',
  adminUsername: 'Jane Doe (Admin)',
} as StaffInviteEmailProps;

export default StaffInviteEmail;
