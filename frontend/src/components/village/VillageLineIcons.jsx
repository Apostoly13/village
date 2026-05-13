import React from "react";

const Base = React.forwardRef(function Base(
  { size = 24, strokeWidth = 1.5, className = "", children, title, ...rest },
  ref
) {
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : "true"}
      role={title ? "img" : undefined}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
});

export const HomeIcon = (props) => (
  <Base {...props}>
    <path d="M3.5 11.2 12 4l8.5 7.2"/>
    <path d="M5.5 10.5v9h13v-9"/>
    <path d="M10 19.5v-5h4v5"/>
  </Base>
);

export const VillageIcon = (props) => (
  <Base {...props}>
    <path d="M2.5 20V12l3.5-3 3.5 3v8"/>
    <path d="M9.5 20v-9l4-3.5 4 3.5v9"/>
    <path d="M17.5 20v-7l2-1.7 2 1.7v7"/>
    <path d="M2.5 20h19"/>
  </Base>
);

export const SpacesIcon = (props) => (
  <Base {...props}>
    <rect x="3.5" y="4" width="17" height="16" rx="2.5"/>
    <path d="M3.5 8.5h17"/>
    <path d="M7.5 12.5h9"/>
    <path d="M7.5 16h6"/>
  </Base>
);

export const ChatRoomsIcon = (props) => (
  <Base {...props}>
    <path d="M4 6.5c0-1.1.9-2 2-2h8.5c1.1 0 2 .9 2 2v5.5c0 1.1-.9 2-2 2H9l-3.5 2.5V14H6c-1.1 0-2-.9-2-2V6.5Z"/>
    <path d="M18 9.5h.8c1 0 1.7.8 1.7 1.8v4.2c0 1-.8 1.8-1.8 1.8H18l-2.5 1.9V17"/>
  </Base>
);

export const MessagesIcon = (props) => (
  <Base {...props}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.2"/>
    <path d="M4.5 7.5 12 13l7.5-5.5"/>
  </Base>
);

export const FriendsIcon = (props) => (
  <Base {...props}>
    <circle cx="9" cy="8" r="2.7"/>
    <circle cx="16" cy="9" r="2.1"/>
    <path d="M4 20c.8-3.4 2.7-5 5-5s4.2 1.6 5 5"/>
    <path d="M13.5 15.4c2.5.2 4.4 1.8 5 4.6"/>
  </Base>
);

export const SavedIcon = (props) => (
  <Base {...props}>
    <path d="M6.5 4.5h11v16L12 17l-5.5 3.5v-16Z"/>
  </Base>
);

export const EventsIcon = (props) => (
  <Base {...props}>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5"/>
    <path d="M3.5 10h17"/>
    <path d="M8 3.5v3"/>
    <path d="M16 3.5v3"/>
    <path d="M8 14h3"/>
    <path d="M13.5 14H16"/>
  </Base>
);

export const StallIcon = (props) => (
  <Base {...props}>
    <path d="M3.5 9 5 5h14l1.5 4"/>
    <path d="M4 9h16v11H4V9Z"/>
    <path d="M8 9v2.2a2.5 2.5 0 0 0 5 0V9"/>
    <path d="M13 9v2.2a2.5 2.5 0 0 0 5 0V9"/>
    <path d="M9 15h6v5H9z"/>
  </Base>
);

export const BlogIcon = (props) => (
  <Base {...props}>
    <path d="M5 20c5.5-1.5 10-5.5 14-15-8 .8-13.5 4.5-15 13l1 2Z"/>
    <path d="M5 20 12 13"/>
    <path d="M11 12l3-3"/>
  </Base>
);

export const ProfileIcon = (props) => (
  <Base {...props}>
    <circle cx="12" cy="8" r="3.2"/>
    <path d="M5 20c1.2-4 3.6-6 7-6s5.8 2 7 6"/>
  </Base>
);

export const SettingsIcon = (props) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="2.8"/>
    <path d="M12 3.5v2.3"/>
    <path d="M12 18.2v2.3"/>
    <path d="M3.5 12h2.3"/>
    <path d="M18.2 12h2.3"/>
    <path d="M6 6l1.6 1.6"/>
    <path d="M16.4 16.4 18 18"/>
    <path d="M18 6l-1.6 1.6"/>
    <path d="M7.6 16.4 6 18"/>
  </Base>
);

export const AdminIcon = (props) => (
  <Base {...props}>
    <path d="M12 3.5 5 6.5v5.8c0 4.2 2.8 7 7 8.2 4.2-1.2 7-4 7-8.2V6.5l-7-3Z"/>
    <path d="M9 12.2l2 2 4-4"/>
  </Base>
);

export const ModeratorIcon = (props) => (
  <Base {...props}>
    <path d="M5 4.5v15"/>
    <path d="M5 5.5h11l-1 3 1 3H5"/>
  </Base>
);

export const NotificationsIcon = (props) => (
  <Base {...props}>
    <path d="M18 10.5a6 6 0 0 0-12 0c0 5-2 5.5-2 7h16c0-1.5-2-2-2-7Z"/>
    <path d="M9.5 20a2.7 2.7 0 0 0 5 0"/>
  </Base>
);

export const SearchIcon = (props) => (
  <Base {...props}>
    <circle cx="10.5" cy="10.5" r="6"/>
    <path d="m15 15 5 5"/>
  </Base>
);

export const FilterIcon = (props) => (
  <Base {...props}>
    <path d="M4 6h16"/>
    <path d="M7 12h10"/>
    <path d="M10 18h4"/>
  </Base>
);

export const PlusIcon = (props) => (
  <Base {...props}>
    <path d="M12 5v14"/>
    <path d="M5 12h14"/>
  </Base>
);

export const SendIcon = (props) => (
  <Base {...props}>
    <path d="M4 5l16 7-16 7 3-7-3-7Z"/>
    <path d="M7 12h8"/>
  </Base>
);

export const EditIcon = (props) => (
  <Base {...props}>
    <path d="M4.5 19.5h4l10-10a2.1 2.1 0 0 0-3-3l-10 10-1 3Z"/>
    <path d="M14.5 7.5l2 2"/>
  </Base>
);

export const DeleteIcon = (props) => (
  <Base {...props}>
    <path d="M5 7h14"/>
    <path d="M9 7V5h6v2"/>
    <path d="M7 7l1 13h8l1-13"/>
    <path d="M10 11v5"/>
    <path d="M14 11v5"/>
  </Base>
);

export const CloseIcon = (props) => (
  <Base {...props}>
    <path d="M6 6l12 12"/>
    <path d="M18 6 6 18"/>
  </Base>
);

export const MenuIcon = (props) => (
  <Base {...props}>
    <path d="M4 7h16"/>
    <path d="M4 12h16"/>
    <path d="M4 17h16"/>
  </Base>
);

export const BackIcon = (props) => (
  <Base {...props}>
    <path d="M19 12H5"/>
    <path d="m11 6-6 6 6 6"/>
  </Base>
);

export const ChevronDownIcon = (props) => (
  <Base {...props}>
    <path d="m6 9 6 6 6-6"/>
  </Base>
);

export const CheckIcon = (props) => (
  <Base {...props}>
    <path d="M5 12.5 9.5 17 19 7"/>
  </Base>
);

export const LockIcon = (props) => (
  <Base {...props}>
    <rect x="5" y="10.5" width="14" height="10" rx="2"/>
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>
  </Base>
);

export const UnlockIcon = (props) => (
  <Base {...props}>
    <rect x="5" y="10.5" width="14" height="10" rx="2"/>
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 6.3-2.1"/>
  </Base>
);

export const AnonymousIcon = (props) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="9"/>
    <path d="M6.5 11h4"/>
    <path d="M13.5 11h4"/>
    <path d="M8 15c1 1.1 2.3 1.7 4 1.7s3-.6 4-1.7"/>
  </Base>
);

export const PrivacyIcon = (props) => (
  <Base {...props}>
    <path d="M12 3.5 5 6.5v5.8c0 4.2 2.8 7 7 8.2 4.2-1.2 7-4 7-8.2V6.5l-7-3Z"/>
    <path d="M9 12.2l2 2 4-4"/>
  </Base>
);

export const ReportIcon = (props) => (
  <Base {...props}>
    <path d="M5 4v16"/>
    <path d="M5 5h11l-1.2 3L16 11H5"/>
  </Base>
);

export const BlockIcon = (props) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="8.5"/>
    <path d="m6.5 17.5 11-11"/>
  </Base>
);

export const VisibleIcon = (props) => (
  <Base {...props}>
    <path d="M3.5 12s3-5.5 8.5-5.5S20.5 12 20.5 12s-3 5.5-8.5 5.5S3.5 12 3.5 12Z"/>
    <circle cx="12" cy="12" r="2.7"/>
  </Base>
);

export const HiddenIcon = (props) => (
  <Base {...props}>
    <path d="M3.5 12s2.3-4.2 6.5-5.2"/>
    <path d="M14 6.8c4.2 1 6.5 5.2 6.5 5.2s-3 5.5-8.5 5.5c-1.5 0-2.8-.4-3.9-.9"/>
    <path d="m4.5 4.5 15 15"/>
  </Base>
);

export const VillagePlusIcon = (props) => (
  <Base {...props}>
    <path d="M12 4l1.7 5.4L19 11l-5.3 1.6L12 18l-1.7-5.4L5 11l5.3-1.6L12 4Z"/>
    <path d="M19 4v4"/>
    <path d="M17 6h4"/>
  </Base>
);

export const CrownIcon = (props) => (
  <Base {...props}>
    <path d="M4.5 8.5 8.5 13 12 7l3.5 6 4-4.5V18h-15V8.5Z"/>
    <path d="M4.5 18h15"/>
  </Base>
);

export const ExpectingIcon = (props) => (
  <Base {...props}>
    <circle cx="12" cy="7.5" r="2.5"/>
    <path d="M8.5 20c.2-5 1.4-8.5 3.5-8.5s3.3 3.5 3.5 8.5"/>
    <path d="M9 15.5c1.8 1.2 4.2 1.2 6 0"/>
  </Base>
);

export const NewbornIcon = (props) => (
  <Base {...props}>
    <path d="M6 12a6 6 0 0 1 12 0v2.5a6 6 0 0 1-12 0V12Z"/>
    <path d="M8 12c2.2 1.4 5.8 1.4 8 0"/>
    <path d="M9 17h6"/>
    <path d="M10 9.5h.1"/>
    <path d="M14 9.5h.1"/>
  </Base>
);

export const BabyIcon = (props) => (
  <Base {...props}>
    <path d="M9 3h6"/>
    <path d="M9 3v2.5a2 2 0 0 0 .6 1.4l.4.4V19a2 2 0 0 0 4 0V7.3l.4-.4A2 2 0 0 0 15 5.5V3"/>
    <path d="M10 12h4"/>
    <path d="M10 15h4"/>
  </Base>
);

export const ToddlerIcon = (props) => (
  <Base {...props}>
    <circle cx="12" cy="5.5" r="2"/>
    <path d="M12 7.5v6"/>
    <path d="M8 11h8"/>
    <path d="M12 13.5 8.5 20"/>
    <path d="M12 13.5l3.5 6.5"/>
  </Base>
);

export const SchoolAgeIcon = (props) => (
  <Base {...props}>
    <path d="M5 8.5 12 5l7 3.5-7 3.5-7-3.5Z"/>
    <path d="M8 10.5V15c1.2 1 2.5 1.5 4 1.5s2.8-.5 4-1.5v-4.5"/>
    <path d="M19 8.5V14"/>
  </Base>
);

export const TeenagerIcon = (props) => (
  <Base {...props}>
    <circle cx="12" cy="7.5" r="3"/>
    <path d="M6.5 20c1.1-4 3-6 5.5-6s4.4 2 5.5 6"/>
    <path d="M8.8 7.2c1.2-1.8 4.4-2.2 6.4 0"/>
  </Base>
);

export const MixedAgesIcon = (props) => (
  <Base {...props}>
    <circle cx="8" cy="8" r="2.2"/>
    <circle cx="16" cy="7" r="2.6"/>
    <circle cx="13" cy="14" r="1.8"/>
    <path d="M4 20c.5-3 1.9-4.5 4-4.5"/>
    <path d="M12 12.5c.9-1.2 2.2-1.8 4-1.8 2.4 0 4 1.7 4.7 5"/>
    <path d="M9.5 20c.5-2.5 1.6-3.7 3.5-3.7s3 1.2 3.5 3.7"/>
  </Base>
);

export const SoloParentIcon = (props) => (
  <Base {...props}>
    <circle cx="10" cy="7" r="2.7"/>
    <circle cx="16.5" cy="11" r="1.8"/>
    <path d="M5 20c.8-4 2.5-6 5-6 1.4 0 2.5.6 3.4 1.7"/>
    <path d="M14 20c.4-2.3 1.2-3.4 2.5-3.4s2.1 1.1 2.5 3.4"/>
  </Base>
);

export const MumsIcon = (props) => (
  <Base {...props}>
    <circle cx="10" cy="7" r="2.7"/>
    <path d="M5 20c.8-4 2.5-6 5-6s4.2 2 5 6"/>
    <path d="M16.5 8.5c1.8 0 3 1.2 3 3 0 2.8-3.5 5-3.5 5s-3.5-2.2-3.5-5c0-1.8 1.2-3 3-3 .4 0 .8.1 1 .3.2-.2.6-.3 1-.3Z"/>
  </Base>
);

export const DadsIcon = (props) => (
  <Base {...props}>
    <circle cx="9" cy="7" r="2.7"/>
    <path d="M4 20c.8-4 2.5-6 5-6s4.2 2 5 6"/>
    <path d="M16 6h4v4"/>
    <path d="m20 6-5 5"/>
  </Base>
);

export const ParentChildIcon = (props) => (
  <Base {...props}>
    <circle cx="9" cy="6.5" r="2.4"/>
    <path d="M5.5 20v-6a3.5 3.5 0 0 1 7 0v6"/>
    <circle cx="17" cy="10" r="1.7"/>
    <path d="M14.5 20v-4a2.5 2.5 0 0 1 5 0v4"/>
  </Base>
);

export const DiscussionIcon = (props) => (
  <Base {...props}>
    <path d="M4 6.5c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v7c0 1.1-.9 2-2 2H10l-4 3v-3H6c-1.1 0-2-.9-2-2v-7Z"/>
    <path d="M8 9h8"/>
    <path d="M8 12h5"/>
  </Base>
);

export const QuestionIcon = (props) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="9"/>
    <path d="M9.5 9a2.7 2.7 0 1 1 4.5 2c-1.2.9-2 1.5-2 3"/>
    <path d="M12 17h.1"/>
  </Base>
);

export const MilestoneIcon = (props) => (
  <Base {...props}>
    <path d="M4 20V13h16v7"/>
    <path d="M4 16.5c2 1.2 4 1.2 6 0s4-1.2 6 0 4 1.2 4 0"/>
    <path d="M8 13V9"/>
    <path d="M12 13V8"/>
    <path d="M16 13V9"/>
  </Base>
);

export const MeetupIcon = (props) => (
  <Base {...props}>
    <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 1 1 13 0c0 5-6.5 11-6.5 11Z"/>
    <circle cx="12" cy="10" r="2.3"/>
  </Base>
);

export const PollIcon = (props) => (
  <Base {...props}>
    <path d="M5 20V10"/>
    <path d="M12 20V5"/>
    <path d="M19 20v-7"/>
    <path d="M4 20h16"/>
  </Base>
);

export const GeneralPostIcon = (props) => (
  <Base {...props}>
    <rect x="4" y="4.5" width="16" height="15" rx="2.5"/>
    <path d="M8 9h8"/>
    <path d="M8 12.5h8"/>
    <path d="M8 16h5"/>
  </Base>
);

export const SleepIcon = (props) => (
  <Base {...props}>
    <path d="M3 18c2-2 6-2 9-2s7 0 9 2"/>
    <path d="M9 9h4l-4 5h4"/>
    <path d="M14 5h3l-3 3h3"/>
  </Base>
);

export const FeedingIcon = (props) => (
  <Base {...props}>
    <path d="M8 3h8"/>
    <path d="M9 3v3.5L7 9v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9l-2-2.5V3"/>
    <path d="M9 13h6"/>
    <path d="M9 16h6"/>
  </Base>
);

export const WellbeingIcon = (props) => (
  <Base {...props}>
    <path d="M3.5 12.5h3l1.5-3 2 5 1.5-2h2"/>
    <path d="M13.5 12.5h7"/>
    <path d="M20.5 12.5c0-3-2.4-5.5-5.4-5.5-1.4 0-2.7.6-3.6 1.5-.9-.9-2.2-1.5-3.6-1.5-3 0-5.4 2.5-5.4 5.5 0 5.5 9 10 9 10s2-1 4-2.7"/>
  </Base>
);

export const RealTalkIcon = (props) => (
  <Base {...props}>
    <path d="M4 7c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2h-5l-4 4v-4H6c-1.1 0-2-.9-2-2V7Z"/>
    <path d="M9 9.5h.1"/>
    <path d="M12 9.5h.1"/>
    <path d="M15 9.5h.1"/>
  </Base>
);

export const LocalIcon = (props) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="8.5"/>
    <circle cx="12" cy="12" r="4.5"/>
    <path d="M12 9.7 10.6 11c-.8.8-.4 2.2.7 2.5.5.1.9.1 1.4 0 1.1-.3 1.5-1.7.7-2.5L12 9.7Z" fill="currentColor" stroke="none"/>
  </Base>
);

export const RelationshipsIcon = (props) => (
  <Base {...props}>
    <path d="M9.5 18s-6-3.6-6-8A3.5 3.5 0 0 1 10 8c.6-1.1 1.8-1.8 3-1.8"/>
    <path d="M14.5 19s6-3.6 6-8a3.5 3.5 0 0 0-6.5-1.8 3.5 3.5 0 0 0-4.5-.9"/>
  </Base>
);

export const PlaygroupIcon = (props) => (
  <Base {...props}>
    <path d="M5 18V9l7-5 7 5v9"/>
    <path d="M8 18v-5h8v5"/>
    <circle cx="8" cy="20" r="1"/>
    <circle cx="16" cy="20" r="1"/>
  </Base>
);

export const WorkshopIcon = (props) => (
  <Base {...props}>
    <rect x="4" y="5" width="16" height="14" rx="2"/>
    <path d="M8 9h8"/>
    <path d="M8 13h5"/>
    <path d="M16 15l2 2"/>
    <path d="M18 15l-2 2"/>
  </Base>
);

export const SupportIcon = (props) => (
  <Base {...props}>
    <path d="M9 12V6.5a1.5 1.5 0 0 1 3 0V12"/>
    <path d="M12 12V5.5a1.5 1.5 0 0 1 3 0V12"/>
    <path d="M15 12V8a1.5 1.5 0 0 1 3 0v7a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5v-3a1.5 1.5 0 0 1 3 0v2"/>
  </Base>
);

export const SellIcon = (props) => (
  <Base {...props}>
    <path d="M4.5 12.5 12 5h6.5v6.5L11 19 4.5 12.5Z"/>
    <circle cx="15.5" cy="8.5" r=".9" fill="currentColor" stroke="none"/>
  </Base>
);

export const SwapIcon = (props) => (
  <Base {...props}>
    <path d="M7 7h10"/>
    <path d="m14 4 3 3-3 3"/>
    <path d="M17 17H7"/>
    <path d="m10 14-3 3 3 3"/>
  </Base>
);

export const DonateIcon = (props) => (
  <Base {...props}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>
    <path d="M12 9v5"/>
    <path d="M9.5 11.5h5"/>
  </Base>
);

export const WantedIcon = (props) => (
  <Base {...props}>
    <circle cx="10.5" cy="10.5" r="5.5"/>
    <path d="m14.5 14.5 4.5 4.5"/>
    <path d="M10.5 8.2v4.6"/>
    <path d="M8.2 10.5h4.6"/>
  </Base>
);

export const ClinicianIcon = (props) => (
  <Base {...props}>
    <path d="M6 4v6a4 4 0 0 0 8 0V4"/>
    <path d="M10 14v1.5A4.5 4.5 0 0 0 14.5 20"/>
    <circle cx="18" cy="16" r="2.5"/>
  </Base>
);

export const VerifiedIcon = (props) => (
  <Base {...props}>
    <path d="M12 3.5 5 6.5v5.8c0 4.2 2.8 7 7 8.2 4.2-1.2 7-4 7-8.2V6.5l-7-3Z"/>
    <path d="M9 12.2l2 2 4-4"/>
  </Base>
);

export const CrisisSupportIcon = (props) => (
  <Base {...props}>
    <path d="M5 4.5h3.5l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5V19a2 2 0 0 1-2 2A15 15 0 0 1 3 6.5a2 2 0 0 1 2-2Z"/>
  </Base>
);

export const AustraliaIcon = (props) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="9"/>
    <path d="M3 12h18"/>
    <path d="M12 3a13 13 0 0 1 0 18"/>
    <path d="M12 3a13 13 0 0 0 0 18"/>
    <circle cx="14.7" cy="14.5" r=".7" fill="currentColor" stroke="none"/>
    <circle cx="9.6" cy="10.2" r=".7" fill="currentColor" stroke="none"/>
  </Base>
);

export const KindnessIcon = (props) => (
  <Base {...props}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>
  </Base>
);

export const NightOwlIcon = (props) => (
  <Base {...props}>
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>
    <path d="M5 6.5 5.7 8l1.5.5-1.5.6L5 10.5l-.7-1.4-1.5-.6L4.3 8Z" fill="currentColor" stroke="none"/>
  </Base>
);

export const HandshakeIcon = (props) => (
  <Base {...props}>
    <path d="M8 12.5 10.5 10a2 2 0 0 1 2.8 0l.7.7"/>
    <path d="m13.5 14.5 2-2a2 2 0 0 1 2.8 0l.7.7"/>
    <path d="M4 11l4 4"/>
    <path d="M20 11l-4 4"/>
    <path d="m9.5 15.5 2 2a2 2 0 0 0 2.8 0L16 16"/>
  </Base>
);

export const ImageIcon = (props) => (
  <Base {...props}>
    <rect x="4" y="5" width="16" height="14" rx="2"/>
    <circle cx="9" cy="10" r="1.5"/>
    <path d="M6.5 17 11 12.5l3 3 1.5-1.5 2 3"/>
  </Base>
);

export const CameraIcon = (props) => (
  <Base {...props}>
    <path d="M7 7.5 8.5 5h7L17 7.5h2A2.5 2.5 0 0 1 21.5 10v7A2.5 2.5 0 0 1 19 19.5H5A2.5 2.5 0 0 1 2.5 17v-7A2.5 2.5 0 0 1 5 7.5h2Z"/>
    <circle cx="12" cy="13.5" r="3.2"/>
  </Base>
);

export const villageLineIconMap = {
  "home": HomeIcon,
  "village": VillageIcon,
  "spaces": SpacesIcon,
  "chat-rooms": ChatRoomsIcon,
  "messages": MessagesIcon,
  "friends": FriendsIcon,
  "saved": SavedIcon,
  "events": EventsIcon,
  "stall": StallIcon,
  "blog": BlogIcon,
  "profile": ProfileIcon,
  "settings": SettingsIcon,
  "admin": AdminIcon,
  "moderator": ModeratorIcon,
  "notifications": NotificationsIcon,
  "search": SearchIcon,
  "filter": FilterIcon,
  "plus": PlusIcon,
  "send": SendIcon,
  "edit": EditIcon,
  "delete": DeleteIcon,
  "close": CloseIcon,
  "menu": MenuIcon,
  "back": BackIcon,
  "chevron-down": ChevronDownIcon,
  "check": CheckIcon,
  "lock": LockIcon,
  "unlock": UnlockIcon,
  "anonymous": AnonymousIcon,
  "privacy": PrivacyIcon,
  "report": ReportIcon,
  "block": BlockIcon,
  "visible": VisibleIcon,
  "hidden": HiddenIcon,
  "village-plus": VillagePlusIcon,
  "crown": CrownIcon,
  "expecting": ExpectingIcon,
  "newborn": NewbornIcon,
  "baby": BabyIcon,
  "toddler": ToddlerIcon,
  "school-age": SchoolAgeIcon,
  "teenager": TeenagerIcon,
  "mixed-ages": MixedAgesIcon,
  "solo-parent": SoloParentIcon,
  "mums": MumsIcon,
  "dads": DadsIcon,
  "parent-child": ParentChildIcon,
  "discussion": DiscussionIcon,
  "question": QuestionIcon,
  "milestone": MilestoneIcon,
  "meetup": MeetupIcon,
  "poll": PollIcon,
  "general-post": GeneralPostIcon,
  "sleep": SleepIcon,
  "feeding": FeedingIcon,
  "wellbeing": WellbeingIcon,
  "real-talk": RealTalkIcon,
  "local": LocalIcon,
  "relationships": RelationshipsIcon,
  "playgroup": PlaygroupIcon,
  "workshop": WorkshopIcon,
  "support": SupportIcon,
  "sell": SellIcon,
  "swap": SwapIcon,
  "donate": DonateIcon,
  "wanted": WantedIcon,
  "clinician": ClinicianIcon,
  "verified": VerifiedIcon,
  "crisis-support": CrisisSupportIcon,
  "australia": AustraliaIcon,
  "kindness": KindnessIcon,
  "night-owl": NightOwlIcon,
  "handshake": HandshakeIcon,
  "image": ImageIcon,
  "camera": CameraIcon,
};

export function VillageLineIcon({ name, ...props }) {
  const Icon = villageLineIconMap[name];
  return Icon ? <Icon {...props} /> : null;
}

export default villageLineIconMap;
