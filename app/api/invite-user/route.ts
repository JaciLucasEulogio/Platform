import { InviteUserEmail } from '@/emails/invite-user';
import { NextResponse } from 'next/server';
import Mailgun from 'mailgun.js';
import FormData from 'form-data';

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: 'api',
  key: 'e3111f792915b819c348017b0f47b417-67bd41c2-56dbd88a',
});

export async function POST(request: Request) {
  try {
    const { to, username, projectName, invitedByUsername, projectId, role } = await request.json();

    const subject = 'Invitation to join a project';
    const text = `Hello ${username},

You have been invited to join the project "${projectName}" by ${invitedByUsername}.
To join the project, click on the link below:

${request.headers.get('origin')}/invites/${projectId}?role=${role}`;

    const data = await mg.messages.create('sandbox2c5d4c45d9604547a645008ef5f1a227.mailgun.org', {
      from: 'ProjeX <postmaster@sandbox2c5d4c45d9604547a645008ef5f1a227.mailgun.org>',
      to: [to],
      subject,
      text,
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error sending email with Mailgun:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
