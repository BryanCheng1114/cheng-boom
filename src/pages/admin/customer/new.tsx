import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: '/admin/seller-setup/new',
    permanent: false,
  },
});

export default function LegacyAddCustomerRedirect() {
  return null;
}
