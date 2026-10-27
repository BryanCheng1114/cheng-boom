import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: '/admin/seller-setup',
    permanent: false,
  },
});

export default function CustomersRedirect() {
  return null;
}
