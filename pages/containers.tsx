import { InferGetServerSidePropsType } from 'next';
import React from 'react';
import { ContainerResponse } from './api/containers';
import { ContainerStats } from '../components/ContainerStats'

/**
 * Containers
 */
const containers = ({ data }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
    return (
        <main>
            <table className='table-auto'>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Server</th>
                        <th>Project</th>
                        <th>State</th>
                        <th>Image</th>
                        <th>Ports</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(data).map((server) =>
                        data[server].map((container, idx) => {
                            return (
                                <tr key={idx}>
                                    <td className='!text-left flex justify-between name'>
                                        {container.Names[0].substr(1)}

                                        <div>
                                        </div>
                                    </td>
                                    <td>{server}</td>
                                    <td>{container.Labels['com.docker.compose.project'] ?? ''}</td>
                                    <td>{container.State}</td>
                                    <td>{container.Image}</td>
                                    <td>
                                        {container.Ports.map((port, idx) => {
                                            if (idx % 2 === 0)
                                                return (
                                                    <p key={idx}>
                                                        <a href={`http://localhost:${port.PublicPort}`} target='_blank' rel='noreferrer'>
                                                            {port.PublicPort}
                                                        </a>
                                                    </p>
                                                );
                                        })}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
            <div>
                <ContainerStats></ContainerStats>
            </div>
        </main>
    );
};



export const getServerSideProps = async () => {
    const res = await fetch('http://localhost:3000/api/containers');
    const data: ContainerResponse = await res.json();

    return {
        props: {
            data,
        },
    };
};

export default containers;