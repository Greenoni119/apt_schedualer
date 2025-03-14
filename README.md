# AppointEase - Appointment Scheduling App

A modern appointment scheduling application built with Next.js and Supabase with dark mode support. This application allows users to book appointments by selecting appointment types, dates, time slots, and providing contact information.

## Features

- 🌓 Dark mode support
- 📅 Interactive date and time selection
- 🔍 Filtering time slots by morning/afternoon and availability
- 📱 Responsive UI for all device sizes
- 🔒 User authentication with Supabase
- 📊 Real-time availability management

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd selfhelp_aptapp
```

2. Install the dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

4. Set up the Supabase database (see [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed instructions)

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Supabase Integration

This application uses Supabase for authentication and database functionality:

1. User authentication (login/signup)
2. Appointment types storage
3. Time slots and availability management
4. Appointment bookings

For detailed setup instructions, see [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

## Project Structure

- `/app` - Next.js app router pages and layouts
- `/components` - Reusable React components
- `/contexts` - React context providers
- `/lib` - Utility functions and Supabase client
- `/public` - Static assets

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.